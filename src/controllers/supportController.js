const supportQueries = require('../db/supportQueries');

async function getOrCreateConversation(req, res) {
  try {
    const conversation = await supportQueries.findOrCreateConversation(req.user.id);
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get conversation' });
  }
}

async function getMessages(req, res) {
  try {
    const conversation = await supportQueries.findOrCreateConversation(req.user.id);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const messages = await supportQueries.getMessages(conversation.id, { limit, offset });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function sendMessage(req, res) {
  try {
    const conversation = await supportQueries.findOrCreateConversation(req.user.id);
    const message = await supportQueries.addMessage({
      conversationId: conversation.id,
      senderType: 'user',
      message: req.body.message,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
}

module.exports = { getOrCreateConversation, getMessages, sendMessage };
