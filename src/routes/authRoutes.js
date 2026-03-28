const { Router } = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.post('/signup', validate(schemas.signup), authController.signup);
router.post('/login', validate(schemas.login), authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(schemas.updateProfile), authController.updateProfile);

module.exports = router;
