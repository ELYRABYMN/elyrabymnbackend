const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getProductById,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleActive,
  addReview,
  deleteReview,
  getCategories,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/', getProducts);
router.get('/categories/list', getCategories);
router.get('/slug/:slug', getProductBySlug);

// Admin
router.get('/admin/all', protect, admin, getAdminProducts);
router.post('/', protect, admin, createProduct);

// Must come after specific routes
router.get('/:id', getProductById);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.patch('/:id/toggle', protect, admin, toggleActive);
router.post('/:id/reviews', protect, admin, addReview);
router.delete('/:id/reviews/:reviewId', protect, admin, deleteReview);

module.exports = router;
