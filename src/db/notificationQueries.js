const pool = require('../config/db');

async function createForAllUsers(title, body) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, title, body)
     SELECT id, $1, $2 FROM users
     RETURNING id`,
    [title, body]
  );
  return rows.length;
}

async function findByUserId(userId, { limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT id, title, body, read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

async function countUnread(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );
  return rows[0].count;
}

async function markAsRead(id, userId) {
  const { rows } = await pool.query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function markAllAsRead(userId) {
  await pool.query(
    `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );
}

module.exports = { createForAllUsers, findByUserId, countUnread, markAsRead, markAllAsRead };
