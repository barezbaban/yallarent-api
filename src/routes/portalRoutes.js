const { Router } = require('express');
const portalController = require('../controllers/portalController');
const adminAuth = require('../middleware/adminAuth');

const router = Router();

// Public
router.post('/login', portalController.login);

// Protected
router.get('/me', adminAuth, portalController.me);
router.get('/dashboard', adminAuth, portalController.dashboard);

module.exports = router;
