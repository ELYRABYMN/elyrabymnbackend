const asyncHandler = require('express-async-handler');

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private/Admin
const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url, fullUrl: `${req.protocol}://${req.get('host')}${url}` });
});

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private/Admin
const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) {
    res.status(400);
    throw new Error('No files uploaded');
  }
  const urls = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    fullUrl: `${req.protocol}://${req.get('host')}/uploads/${f.filename}`,
  }));
  res.json({ success: true, urls });
});

module.exports = { uploadSingle, uploadMultiple };
