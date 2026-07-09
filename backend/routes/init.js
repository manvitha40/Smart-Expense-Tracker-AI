const express = require('express');
const router = express.Router();
const { seedDemoDataEndpoint } = require('../controllers/initController');

// @route   POST api/init/seed-demo
// @desc    Force re-seed demo account database
// @access  Public
router.post('/seed-demo', seedDemoDataEndpoint);

module.exports = router;
