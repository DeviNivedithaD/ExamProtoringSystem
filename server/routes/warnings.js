const express = require('express');
const router = express.Router();
const warningController = require('../controllers/warningController');

router.post('/', warningController.logWarning);

module.exports = router;
