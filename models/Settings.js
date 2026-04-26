const mongoose = require('mongoose');

/*
  Singleton settings document — only one will exist.
  Controls home page hero, announcement bar, For Her section, Shop Category,
  and per-category hero images.
*/

const forherSlotSchema = new mongoose.Schema({
  customImage: String,
  customTitle: String,
  slug: String,
  pricePKR: Number,
  priceUSD: Number,
  priceEUR: Number,
  priceGBP: Number,
  discountPricePKR: Number,
  discountPriceUSD: Number,
  discountPriceEUR: Number,
  discountPriceGBP: Number,
}, { _id: false });

const shopCategorySchema = new mongoose.Schema({
  name: String,       // display label e.g. WOMEN
  image: String,      // thumbnail
  category: String,   // which category it links to (exact DB match)
}, { _id: false });

const categoryHeroSchema = new mongoose.Schema({
  category: String,   // exact DB category value e.g. "New Arrival"
  label: String,      // display name e.g. "NEW ARRIVAL"
  subtitle: String,   // small tagline
  heroImage: String,
  thumbImage: String,
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  // Announcement bar
  announcementText: { type: String, default: '✦ COMPLIMENTARY SHIPPING ON ORDERS OVER Rs.5,000 ✦' },
  announcementMobile: { type: String, default: '✦ FREE SHIPPING OVER Rs.5,000 ✦ EASY RETURNS ✦' },

  // Home hero
  heroImage: { type: String, default: 'https://images.pexels.com/photos/5709659/pexels-photo-5709659.jpeg?auto=compress&cs=tinysrgb&w=1600&dpr=2' },
  heroHeading: { type: String, default: 'SPRING SUMMER' },
  heroSubtext: { type: String, default: 'SHOP NOW' },
  heroSubLink: { type: String, default: '#' },

  // For Her section
  forherMainImage: { type: String, default: 'https://i.pinimg.com/736x/59/d7/11/59d7110c089892a546498d918c5f630c.jpg' },
  forherSlot1: forherSlotSchema,
  forherSlot2: forherSlotSchema,
  forherSlot3: forherSlotSchema,
  forherSlot4: forherSlotSchema,

  // Shop By Category (home page grid)
  shopCategories: { type: [shopCategorySchema], default: [] },

  // Per-category hero images (category page)
  categoryHeroes: { type: [categoryHeroSchema], default: [] },

  // Contact info
  whatsappNumber: { type: String, default: '923001234567' },
  contactEmail: { type: String, default: 'contact@minimalluxe.com' },
  contactPhone: { type: String, default: '+92 300 1234567' },
  contactAddress: { type: String, default: 'Lahore, Pakistan' },

  // Social
  facebookUrl: String,
  instagramUrl: String,
  pinterestUrl: String,

}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
