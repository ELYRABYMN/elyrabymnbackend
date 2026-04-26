const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { generateProductSlug, buildProductLink } = require('../utils/slugGenerator');

// @desc    Get all products (public)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const sort = req.query.sort || '-createdAt';
  const category = req.query.category;
  const search = req.query.search;
  const featured = req.query.featured;

  const filter = { isActive: true };
  if (category && category.trim() !== '') filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    products,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Get product by slug (public)
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// @desc    Get product by ID (admin or public)
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// @desc    Get all products for admin (includes inactive)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort('-createdAt');
  res.json({ success: true, products, total: products.length });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data.name || !data.pricePKR) {
    res.status(400);
    throw new Error('Name and PKR price are required');
  }

  // Generate slug + product link
  let slug = generateProductSlug(data.name);
  // Ensure unique
  while (await Product.findOne({ slug })) {
    slug = generateProductSlug(data.name);
  }
  data.slug = slug;
  data.productLink = buildProductLink(slug);

  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // If name changed, optionally regenerate slug — keep existing slug to preserve links
  // Admin can manually edit slug via the update body if they want
  Object.assign(product, req.body);

  // Rebuild productLink if slug changed
  if (req.body.slug && req.body.slug !== product.slug) {
    product.productLink = buildProductLink(req.body.slug);
  }

  const updated = await product.save();
  res.json({ success: true, product: updated });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc    Toggle active status
// @route   PATCH /api/products/:id/toggle
// @access  Private/Admin
const toggleActive = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  product.isActive = !product.isActive;
  await product.save();
  res.json({ success: true, product });
});

// @desc    Add review
// @route   POST /api/products/:id/reviews
// @access  Private/Admin  (admin-managed reviews)
const addReview = asyncHandler(async (req, res) => {
  const { name, rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  product.reviews.push({ name, rating: Number(rating), comment });
  await product.save();
  res.status(201).json({ success: true, product });
});

// @desc    Delete review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  product.reviews = product.reviews.filter(r => r._id.toString() !== req.params.reviewId);
  await product.save();
  res.json({ success: true, product });
});

// @desc    Get all distinct categories (from products)
// @route   GET /api/products/categories/list
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const cats = await Product.distinct('category', { isActive: true });
  res.json({ success: true, categories: cats });
});

module.exports = {
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
};
