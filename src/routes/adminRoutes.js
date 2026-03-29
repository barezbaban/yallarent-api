const { Router } = require('express');
const authenticate = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = Router();

router.post('/notify', authenticate, adminController.notify);

module.exports = router;
