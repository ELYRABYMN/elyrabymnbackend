const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  image: String,
  size: String,
  color: String,
  quantity: { type: Number, default: 1 },
  price: Number,
  currency: { type: String, default: 'PKR' },
  hasDupatta: { type: Boolean, default: false },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true }, // for WhatsApp
    address: String,
    city: String,
    country: { type: String, default: 'Pakistan' },
  },
  items: { type: [orderItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'PKR' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'COD' },
  notes: String,
}, { timestamps: true });

// Auto generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = 'ML' + String(1000 + count + 1);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
