require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files — uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin panel static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/forher', require('./routes/forherRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Health
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'MINIMAL LUXE API running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      settings: '/api/settings',
      forher: '/api/forher',
      upload: '/api/upload',
      admin_panel: '/admin',
    },
  });
});

// Redirect root to admin
app.get('/', (req, res) => res.redirect('/admin'));

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  ✦ MINIMAL LUXE API                      ║
║  ✦ Running on: http://localhost:${PORT}     ║
║  ✦ Admin panel: http://localhost:${PORT}/admin ║
║  ✦ API root:   http://localhost:${PORT}/api   ║
╚══════════════════════════════════════════╝
  `);
});
