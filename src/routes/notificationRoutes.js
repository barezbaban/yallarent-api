const { Router } = require('express');
const authenticate = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = Router();

router.get('/', authenticate, notificationController.list);
router.get('/unread-count', authenticate, notificationController.unreadCount);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

module.exports = router;
