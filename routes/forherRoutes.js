const express = require('express');
const router = express.Router();
const { getForHer } = require('../controllers/settingsController');

router.get('/', getForHer);

module.exports = router;
