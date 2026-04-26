const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmation, sendStatusUpdateEmail } = require('../utils/sendEmail');

// @desc    Create order (public)
// @route   POST /api/orders
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, subtotal, shipping, total, currency, paymentMethod, notes } = req.body;

  if (!customer?.name || !customer?.phone || !items?.length) {
    res.status(400);
    throw new Error('Customer info and items are required');
  }

  const order = await Order.create({
    customer,
    items,
    subtotal,
    shipping,
    total,
    currency: currency || 'PKR',
    paymentMethod: paymentMethod || 'COD',
    notes,
  });

  // Decrement stock
  for (const item of items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -(item.quantity || 1) },
      });
    }
  }

  // ✅ Send order confirmation email (only if customer provided email)
  if (order.customer?.email) {
    sendOrderConfirmation(order).catch((err) =>
      console.error('❌ Confirmation email failed:', err.message)
    );
  }

  res.status(201).json({ success: true, order });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter).sort('-createdAt');
  res.json({ success: true, orders, total: orders.length });
});

// @desc    Get order by id
// @route   GET /api/orders/:id
// @access  Private/Admin
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json({ success: true, order });
});

// @desc    Update order status (admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const previousStatus = order.status;
  order.status = status;
  await order.save();

  // ✅ Send email only when status actually changes to shipped or delivered
  const notifiable = ['shipped', 'delivered'];
  if (previousStatus !== status && notifiable.includes(status)) {
    if (order.customer?.email) {
      sendStatusUpdateEmail(order).catch((err) =>
        console.error(`❌ Status email [${status}] failed:`, err.message)
      );
    } else {
      console.log(`ℹ️  No email on file for order #${String(order._id).slice(-8)} — skipping`);
    }
  }

  res.json({ success: true, order });
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  await order.deleteOne();
  res.json({ success: true, message: 'Order deleted' });
});

// @desc    Dashboard stats
// @route   GET /api/orders/stats/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ isActive: true });

  // Revenue from delivered + shipped orders
  const revenueAgg = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const recentOrders = await Order.find().sort('-createdAt').limit(5);

  res.json({
    success: true,
    stats: {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalProducts,
      activeProducts,
      revenue,
    },
    recentOrders,
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateStatus,
  deleteOrder,
  getDashboardStats,
};