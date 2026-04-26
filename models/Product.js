const mongoose = require('mongoose');

// Review sub-schema
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

// Size chart row sub-schema
const sizeChartRowSchema = new mongoose.Schema({
  size: String,
  bust: String,
  waist: String,
  hip: String,
  length: String,
  extra: String, // any extra column
}, { _id: false });

// Additional detail sub-schema (flexible key-value)
const additionalDetailSchema = new mongoose.Schema({
  key: String,
  value: String,
}, { _id: false });

// Variant image sub-schema
const variantImageSchema = new mongoose.Schema({
  url: String,
  color: String, // optional color label
}, { _id: false });

const productSchema = new mongoose.Schema({
  // Basic
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true }, // auto generated: domain+name+5digits
  productLink: { type: String }, // full URL stored

  // Category / classification
  category: { type: String, required: true }, // e.g. "New Arrival", "Summer 26", "Occasions"
  fabric: { type: String, default: '' },

  // Prices — PKR is required, others optional
  pricePKR: { type: Number, required: true },
  discountPricePKR: { type: Number, default: null },
  priceUSD: { type: Number, default: null },
  discountPriceUSD: { type: Number, default: null },
  priceEUR: { type: Number, default: null },
  discountPriceEUR: { type: Number, default: null },
  priceGBP: { type: Number, default: null },
  discountPriceGBP: { type: Number, default: null },

  // Sizes (array of strings e.g. ['S','M','L'])
  sizes: { type: [String], default: [] },

  // Size chart — admin manually creates rows/columns
  sizeChart: {
    columns: { type: [String], default: ['Size', 'Bust', 'Waist', 'Hip', 'Length'] },
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] }, // array of { col1, col2, ... }
  },

  // Dupatta
  hasDupatta: { type: Boolean, default: false },
  dupattaPricePKR: { type: Number, default: 0 },
  dupattaPriceUSD: { type: Number, default: 0 },
  dupattaPriceEUR: { type: Number, default: 0 },
  dupattaPriceGBP: { type: Number, default: 0 },

  // Images
  mainImage: { type: String, default: '' }, // link OR uploaded path
  variantImages: { type: [variantImageSchema], default: [] },

  // Description + additional
  description: { type: String, default: '' },
  additionalDetails: { type: [additionalDetailSchema], default: [] },

  // Reviews (admin-managed)
  reviews: { type: [reviewSchema], default: [] },

  // Status / stock
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },

  // Extras
  sku: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate slug: domain is handled in controller; here we just ensure unique + lowercase
productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
