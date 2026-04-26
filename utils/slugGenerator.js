const slugify = require('slugify');

/*
  Generates a product slug in the format:
    {productname}-{5digits}
  
  Example: "Embroidered Kurta" -> "embroidered-kurta-54821"
  
  Full product link: DOMAIN + slug
*/

const generateProductSlug = (name) => {
  const base = slugify(name, { lower: true, strict: true });
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `${base}-${randomDigits}`;
};

const buildProductLink = (slug) => {
  const domain = process.env.DOMAIN || 'https://minimalluxe.com';
  return `${domain}/product/${slug}`;
};

module.exports = { generateProductSlug, buildProductLink };
