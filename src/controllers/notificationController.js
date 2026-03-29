const notificationQueries = require('../db/notificationQueries');

async function list(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  const notifications = await notificationQueries.findByUserId(req.user.id, { limit, offset });
  res.json(notifications);
}

async function unreadCount(req, res) {
  const count = await notificationQueries.countUnread(req.user.id);
  res.json({ count });
}

async function markAsRead(req, res) {
  const notification = await notificationQueries.markAsRead(req.params.id, req.user.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json(notification);
}

async function markAllAsRead(req, res) {
  await notificationQueries.markAllAsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
}

module.exports = { list, unreadCount, markAsRead, markAllAsRead };
