const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getForHer,
  getCategoryHero,
  updateCategoryHero,
  deleteCategoryHero,
} = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/', getSettings);
router.get('/category-hero/:category', getCategoryHero);

// Admin
router.put('/', protect, admin, updateSettings);
router.put('/category-hero', protect, admin, updateCategoryHero);
router.delete('/category-hero/:category', protect, admin, deleteCategoryHero);

module.exports = router;
