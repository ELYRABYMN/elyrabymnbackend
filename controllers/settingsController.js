const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

// helper — always returns the single settings doc
const getOrCreateSettings = async () => {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
};

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  res.json({ success: true, settings: s });
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  let s = await getOrCreateSettings();
  Object.assign(s, req.body);
  await s.save();
  res.json({ success: true, settings: s });
});

// @desc    Get For Her data (with default slots populated)
// @route   GET /api/forher
// @access  Public
const getForHer = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  res.json({
    success: true,
    data: {
      mainImage: s.forherMainImage,
      slot1: s.forherSlot1 || {},
      slot2: s.forherSlot2 || {},
      slot3: s.forherSlot3 || {},
      slot4: s.forherSlot4 || {},
    },
  });
});

// @desc    Get category hero data
// @route   GET /api/settings/category-hero/:category
// @access  Public
const getCategoryHero = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  const hero = s.categoryHeroes?.find(h => h.category === req.params.category);
  res.json({ success: true, hero: hero || null });
});

// @desc    Update/Add a category hero
// @route   PUT /api/settings/category-hero
// @access  Private/Admin
const updateCategoryHero = asyncHandler(async (req, res) => {
  const { category, label, subtitle, heroImage, thumbImage } = req.body;
  if (!category) {
    res.status(400);
    throw new Error('Category is required');
  }
  const s = await getOrCreateSettings();
  const idx = s.categoryHeroes.findIndex(h => h.category === category);
  const entry = { category, label, subtitle, heroImage, thumbImage };

  if (idx >= 0) s.categoryHeroes[idx] = entry;
  else s.categoryHeroes.push(entry);

  await s.save();
  res.json({ success: true, settings: s });
});

// @desc    Delete a category hero
// @route   DELETE /api/settings/category-hero/:category
// @access  Private/Admin
const deleteCategoryHero = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  s.categoryHeroes = s.categoryHeroes.filter(h => h.category !== req.params.category);
  await s.save();
  res.json({ success: true, settings: s });
});

module.exports = {
  getSettings,
  updateSettings,
  getForHer,
  getCategoryHero,
  updateCategoryHero,
  deleteCategoryHero,
};
