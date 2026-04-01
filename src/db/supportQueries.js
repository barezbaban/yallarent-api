const pool = require('../config/db');

async function findOrCreateConversation(userId) {
  // Try to find existing open conversation
  const { rows: existing } = await pool.query(
    "SELECT * FROM support_conversations WHERE user_id = $1 AND status = 'open'",
    [userId]
  );
  if (existing.length > 0) return existing[0];

  // Create new conversation
  const { rows } = await pool.query(
    'INSERT INTO support_conversations (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return rows[0];
}

async function getConversation(conversationId, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM support_conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return rows[0] || null;
}

async function addMessage({ conversationId, senderType, message }) {
  const { rows } = await pool.query(
    `INSERT INTO support_messages (conversation_id, sender_type, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, senderType, message]
  );
  await pool.query(
    'UPDATE support_conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
  );
  return rows[0];
}

async function getMessages(conversationId, { limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM support_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );
  return rows;
}

module.exports = { findOrCreateConversation, getConversation, addMessage, getMessages };
