require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Create admin if not exists
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) {
      console.log('✓ Admin already exists:', existing.email);
    } else {
      const admin = await User.create({
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      });
      console.log('✓ Admin created:', admin.email);
    }

    // Create default settings if not exists
    const s = await Settings.findOne();
    if (!s) {
      await Settings.create({});
      console.log('✓ Default settings created');
    } else {
      console.log('✓ Settings already exist');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login credentials:');
    console.log('  Email:    ', process.env.ADMIN_EMAIL);
    console.log('  Password: ', process.env.ADMIN_PASSWORD);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('✗ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
