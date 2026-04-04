const pool = require('../config/db');

// ── Conversations ──

async function createConversation({ customerId, subject, category, relatedBookingId }) {
  const { rows } = await pool.query(
    `INSERT INTO conversations (customer_id, subject, category, related_booking_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [customerId, subject || null, category || 'general_inquiry', relatedBookingId || null]
  );
  return rows[0];
}

async function findOpenConversation(customerId) {
  const { rows } = await pool.query(
    `SELECT * FROM conversations
     WHERE customer_id = $1 AND status IN ('open', 'waiting_on_customer', 'waiting_on_agent')
     ORDER BY last_message_at DESC LIMIT 1`,
    [customerId]
  );
  return rows[0];
}

async function findConversationById(id) {
  const { rows } = await pool.query(
    `SELECT c.*, u.full_name AS customer_name, u.phone AS customer_phone, u.city AS customer_city, u.created_at AS customer_since,
            ba.full_name AS agent_name
     FROM conversations c
     JOIN users u ON u.id = c.customer_id
     LEFT JOIN backoffice_users ba ON ba.id = c.assigned_agent_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0];
}

async function findConversationsByCustomer(customerId) {
  const { rows } = await pool.query(
    `SELECT c.*, ba.full_name AS agent_name
     FROM conversations c
     LEFT JOIN backoffice_users ba ON ba.id = c.assigned_agent_id
     WHERE c.customer_id = $1
     ORDER BY c.last_message_at DESC`,
    [customerId]
  );
  return rows;
}

async function findConversationsForAgent({ status, priority, category, assignedAgentId, unassigned, search }) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (status) { conditions.push(`c.status = $${idx++}`); values.push(status); }
  if (priority) { conditions.push(`c.priority = $${idx++}`); values.push(priority); }
  if (category) { conditions.push(`c.category = $${idx++}`); values.push(category); }
  if (assignedAgentId) { conditions.push(`c.assigned_agent_id = $${idx++}`); values.push(assignedAgentId); }
  if (unassigned === 'true') { conditions.push('c.assigned_agent_id IS NULL'); }
  if (search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR c.subject ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT c.*, u.full_name AS customer_name, u.phone AS customer_phone,
            ba.full_name AS agent_name
     FROM conversations c
     JOIN users u ON u.id = c.customer_id
     LEFT JOIN backoffice_users ba ON ba.id = c.assigned_agent_id
     ${where}
     ORDER BY c.last_message_at DESC`,
    values
  );
  return rows;
}

async function getConversationWithCustomerProfile(id) {
  const { rows } = await pool.query(
    `SELECT c.*,
            u.full_name AS customer_name, u.phone AS customer_phone, u.city AS customer_city,
            u.created_at AS customer_since,
            ba.full_name AS agent_name,
            (SELECT COUNT(*)::int FROM bookings WHERE renter_id = c.customer_id) AS customer_booking_count
     FROM conversations c
     JOIN users u ON u.id = c.customer_id
     LEFT JOIN backoffice_users ba ON ba.id = c.assigned_agent_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0];
}

async function updateConversation(id, fields) {
  const sets = [];
  const values = [];
  let idx = 1;

  if (fields.status !== undefined) { sets.push(`status = $${idx++}`); values.push(fields.status); }
  if (fields.priority !== undefined) { sets.push(`priority = $${idx++}`); values.push(fields.priority); }
  if (fields.assignedAgentId !== undefined) { sets.push(`assigned_agent_id = $${idx++}`); values.push(fields.assignedAgentId); }
  if (fields.subject !== undefined) { sets.push(`subject = $${idx++}`); values.push(fields.subject); }
  sets.push('updated_at = NOW()');

  if (sets.length === 1) return findConversationById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE conversations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0];
}

async function updateLastMessage(conversationId, preview) {
  await pool.query(
    `UPDATE conversations SET last_message_at = NOW(), last_message_preview = $1, updated_at = NOW() WHERE id = $2`,
    [preview.substring(0, 150), conversationId]
  );
}

async function incrementUnread(conversationId, field) {
  const col = field === 'customer' ? 'unread_count_customer' : 'unread_count_agent';
  await pool.query(`UPDATE conversations SET ${col} = ${col} + 1 WHERE id = $1`, [conversationId]);
}

async function resetUnread(conversationId, field) {
  const col = field === 'customer' ? 'unread_count_customer' : 'unread_count_agent';
  await pool.query(`UPDATE conversations SET ${col} = 0 WHERE id = $1`, [conversationId]);
}

async function getCustomerTotalUnread(customerId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(unread_count_customer), 0)::int AS total
     FROM conversations WHERE customer_id = $1 AND status NOT IN ('closed')`,
    [customerId]
  );
  return rows[0].total;
}

async function getRelatedBooking(bookingId) {
  if (!bookingId) return null;
  const { rows } = await pool.query(
    `SELECT b.id, b.start_date, b.end_date, b.total_price, b.status,
            c.make || ' ' || c.model AS car_name, c.image_url AS car_image
     FROM bookings b
     JOIN cars c ON c.id = b.car_id
     WHERE b.id = $1`,
    [bookingId]
  );
  return rows[0] || null;
}

async function getCustomerRecentBookings(customerId, limit = 5) {
  const { rows } = await pool.query(
    `SELECT b.id, b.start_date, b.end_date, b.total_price, b.status,
            c.make || ' ' || c.model AS car_name
     FROM bookings b
     JOIN cars c ON c.id = b.car_id
     WHERE b.renter_id = $1
     ORDER BY b.created_at DESC LIMIT $2`,
    [customerId, limit]
  );
  return rows;
}

async function getCustomerPastConversations(customerId, excludeId) {
  const { rows } = await pool.query(
    `SELECT id, subject, status, created_at, last_message_at
     FROM conversations
     WHERE customer_id = $1 AND id != $2
     ORDER BY last_message_at DESC LIMIT 10`,
    [customerId, excludeId]
  );
  return rows;
}

async function countRecentConversations(customerId, hoursAgo = 1) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM conversations
     WHERE customer_id = $1 AND created_at > NOW() - INTERVAL '1 hour' * $2`,
    [customerId, hoursAgo]
  );
  return rows[0].count;
}

// ── Messages ──

async function addMessage({ conversationId, senderType, senderId, content, messageType, fileUrl, fileName }) {
  const { rows } = await pool.query(
    `INSERT INTO messages (conversation_id, sender_type, sender_id, content, message_type, file_url, file_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [conversationId, senderType, senderId || null, content, messageType || 'text', fileUrl || null, fileName || null]
  );
  return rows[0];
}

async function getMessages(conversationId, { limit = 30, before }) {
  const conditions = ['conversation_id = $1'];
  const values = [conversationId];
  let idx = 2;

  if (before) {
    conditions.push(`created_at < $${idx++}`);
    values.push(before);
  }

  values.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM messages
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${idx}`,
    values
  );
  return rows.reverse();
}

async function markMessagesRead(conversationId, senderType) {
  await pool.query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_type = $2 AND is_read = FALSE`,
    [conversationId, senderType]
  );
}

async function updateMessage(messageId, { content, editedAt, originalContent }) {
  const { rows } = await pool.query(
    `UPDATE messages SET content = $1, edited_at = $2, original_content = $3 WHERE id = $4 RETURNING *`,
    [content, editedAt, originalContent, messageId]
  );
  return rows[0];
}

async function softDeleteMessage(messageId) {
  const { rows } = await pool.query(
    `UPDATE messages SET is_deleted = TRUE, deleted_at = NOW(), content = 'This message was deleted' WHERE id = $1 RETURNING *`,
    [messageId]
  );
  return rows[0];
}

async function findMessageById(messageId) {
  const { rows } = await pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
  return rows[0];
}

// ── Chat Notes ──

async function addNote({ conversationId, agentId, content }) {
  const { rows } = await pool.query(
    `INSERT INTO chat_notes (conversation_id, agent_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, agentId, content]
  );
  return rows[0];
}

async function getNotes(conversationId) {
  const { rows } = await pool.query(
    `SELECT cn.*, ba.full_name AS agent_name
     FROM chat_notes cn
     JOIN backoffice_users ba ON ba.id = cn.agent_id
     WHERE cn.conversation_id = $1
     ORDER BY cn.created_at DESC`,
    [conversationId]
  );
  return rows;
}

// ── Canned Responses ──

async function findAllCannedResponses() {
  const { rows } = await pool.query(
    `SELECT * FROM canned_responses WHERE is_active = TRUE ORDER BY category, title`
  );
  return rows;
}

async function createCannedResponse({ title, content, category, shortcut }) {
  const { rows } = await pool.query(
    `INSERT INTO canned_responses (title, content, category, shortcut)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, content, category || 'General', shortcut]
  );
  return rows[0];
}

async function updateCannedResponse(id, { title, content, category, shortcut }) {
  const sets = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title); }
  if (content !== undefined) { sets.push(`content = $${idx++}`); values.push(content); }
  if (category !== undefined) { sets.push(`category = $${idx++}`); values.push(category); }
  if (shortcut !== undefined) { sets.push(`shortcut = $${idx++}`); values.push(shortcut); }
  sets.push('updated_at = NOW()');

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE canned_responses SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0];
}

async function deleteCannedResponse(id) {
  await pool.query('UPDATE canned_responses SET is_active = FALSE WHERE id = $1', [id]);
}

module.exports = {
  createConversation, findOpenConversation, findConversationById, findConversationsByCustomer,
  findConversationsForAgent, getConversationWithCustomerProfile, updateConversation,
  updateLastMessage, incrementUnread, resetUnread, getCustomerTotalUnread,
  getRelatedBooking, getCustomerRecentBookings, getCustomerPastConversations,
  countRecentConversations,
  addMessage, getMessages, markMessagesRead, updateMessage, softDeleteMessage, findMessageById,
  addNote, getNotes,
  findAllCannedResponses, createCannedResponse, updateCannedResponse, deleteCannedResponse,
};
