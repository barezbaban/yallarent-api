const { Router } = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, authController.updateProfile);

module.exports = router;
