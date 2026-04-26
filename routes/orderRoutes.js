const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateStatus,
  deleteOrder,
  getDashboardStats,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', createOrder); // public
router.get('/stats/dashboard', protect, admin, getDashboardStats);
router.get('/', protect, admin, getOrders);
router.get('/:id', protect, admin, getOrderById);
router.patch('/:id/status', protect, admin, updateStatus);
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;
