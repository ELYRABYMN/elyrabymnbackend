const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadSingle, uploadMultiple } = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/single', protect, admin, upload.single('image'), uploadSingle);
router.post('/multiple', protect, admin, upload.array('images', 10), uploadMultiple);

module.exports = router;
