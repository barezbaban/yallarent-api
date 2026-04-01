const { Router } = require('express');
const supportController = require('../controllers/supportController');
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.get('/conversation', authenticate, supportController.getOrCreateConversation);
router.get('/conversation/messages', authenticate, supportController.getMessages);
router.post('/conversation/messages', authenticate, validate(schemas.sendSupportMessage), supportController.sendMessage);

module.exports = router;
