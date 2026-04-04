const chatQueries = require('../db/chatQueries');

// ═══════════════════════════════════════════════
// Customer-facing controllers
// ═══════════════════════════════════════════════

async function customerGetConversations(req, res) {
  try {
    const conversations = await chatQueries.findConversationsByCustomer(req.user.id);
    res.json(conversations);
  } catch (err) {
    console.error('[Chat] customerGetConversations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

async function customerCreateConversation(req, res) {
  try {
    const { subject, category, relatedBookingId, message } = req.body;
    const conversation = await chatQueries.createConversation({
      customerId: req.user.id,
      subject,
      category,
      relatedBookingId,
    });

    const msg = await chatQueries.addMessage({
      conversationId: conversation.id,
      senderType: 'customer',
      senderId: req.user.id,
      content: message,
      messageType: 'text',
    });

    await chatQueries.updateLastMessage(conversation.id, message);
    await chatQueries.incrementUnread(conversation.id, 'agent');

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.of('/chat-agent').emit('new_conversation', {
        ...conversation,
        customer_name: req.user.name || req.user.full_name || 'Customer',
        last_message_preview: message,
        last_message_at: msg.created_at,
        unread_count_agent: 1,
      });
    }

    res.status(201).json({ conversation, message: msg });
  } catch (err) {
    console.error('[Chat] customerCreateConversation error:', err.message);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
}

async function customerGetMessages(req, res) {
  try {
    const { id } = req.params;

    // Verify customer owns this conversation
    const conv = await chatQueries.findConversationById(id);
    if (!conv || conv.customer_id !== req.user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { limit, before } = req.query;
    const messages = await chatQueries.getMessages(id, { limit: Number(limit) || 30, before });

    // Mark agent messages as read
    await chatQueries.markMessagesRead(id, 'agent');
    await chatQueries.resetUnread(id, 'customer');

    res.json(messages);
  } catch (err) {
    console.error('[Chat] customerGetMessages error:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function customerSendMessage(req, res) {
  try {
    const { id } = req.params;

    const conv = await chatQueries.findConversationById(id);
    if (!conv || conv.customer_id !== req.user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conv.status === 'closed') {
      return res.status(400).json({ error: 'Conversation is closed' });
    }

    const { content, messageType } = req.body;
    const fileUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;
    const fileName = req.file ? req.file.originalname : null;

    const msg = await chatQueries.addMessage({
      conversationId: id,
      senderType: 'customer',
      senderId: req.user.id,
      content: content || '',
      messageType: req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : messageType,
      fileUrl,
      fileName,
    });

    const msgType = req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : messageType;
    const preview = msgType === 'image' ? '📷 Photo' : (content || fileName || 'Attachment');
    await chatQueries.updateLastMessage(id, preview);
    await chatQueries.incrementUnread(id, 'agent');

    // Update status if it was waiting_on_customer
    if (conv.status === 'waiting_on_customer') {
      await chatQueries.updateConversation(id, { status: 'waiting_on_agent' });
    }

    const io = req.app.get('io');
    if (io) {
      // Emit to agents in the conversation room AND broadcast to all agents
      io.of('/chat-agent').to(`conv:${id}`).emit('new_message', msg);
      io.of('/chat-agent').emit('conversation_updated', { id, lastMessage: msg });
      // Also broadcast new_message to all agents so they see it without joining
      io.of('/chat-agent').emit('new_message', msg);
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error('[Chat] customerSendMessage error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

async function customerGetUnreadCount(req, res) {
  try {
    const total = await chatQueries.getCustomerTotalUnread(req.user.id);
    res.json({ unread: total });
  } catch (err) {
    console.error('[Chat] customerGetUnreadCount error:', err.message);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
}

// ═══════════════════════════════════════════════
// Agent / backoffice controllers
// ═══════════════════════════════════════════════

async function agentGetConversations(req, res) {
  try {
    const { status, priority, category, assignedAgentId, unassigned, search } = req.query;
    const conversations = await chatQueries.findConversationsForAgent({
      status, priority, category, assignedAgentId, unassigned, search,
    });
    res.json(conversations);
  } catch (err) {
    console.error('[Chat] agentGetConversations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

async function agentGetConversation(req, res) {
  try {
    const conv = await chatQueries.getConversationWithCustomerProfile(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const [relatedBooking, recentBookings, pastConversations] = await Promise.all([
      chatQueries.getRelatedBooking(conv.related_booking_id),
      chatQueries.getCustomerRecentBookings(conv.customer_id),
      chatQueries.getCustomerPastConversations(conv.customer_id, conv.id),
    ]);

    res.json({
      conversation: conv,
      customerContext: { relatedBooking, recentBookings, pastConversations },
    });
  } catch (err) {
    console.error('[Chat] agentGetConversation error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
}

async function agentGetMessages(req, res) {
  try {
    const { limit, before } = req.query;
    const messages = await chatQueries.getMessages(req.params.id, { limit: Number(limit) || 30, before });

    // Mark customer messages as read
    await chatQueries.markMessagesRead(req.params.id, 'customer');
    await chatQueries.resetUnread(req.params.id, 'agent');

    res.json(messages);
  } catch (err) {
    console.error('[Chat] agentGetMessages error:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function agentSendMessage(req, res) {
  try {
    const { id } = req.params;
    const conv = await chatQueries.findConversationById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const { content, messageType } = req.body;
    const fileUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;
    const fileName = req.file ? req.file.originalname : null;

    const msg = await chatQueries.addMessage({
      conversationId: id,
      senderType: 'agent',
      senderId: req.admin.id,
      content: content || '',
      messageType: req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : messageType,
      fileUrl,
      fileName,
    });

    const agentMsgType = req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : messageType;
    const agentPreview = agentMsgType === 'image' ? '📷 Photo' : (content || fileName || 'Attachment');
    await chatQueries.updateLastMessage(id, agentPreview);
    await chatQueries.incrementUnread(id, 'customer');

    // Auto-assign if unassigned
    if (!conv.assigned_agent_id) {
      await chatQueries.updateConversation(id, { assignedAgentId: req.admin.id });
    }

    // Update status
    if (conv.status === 'open' || conv.status === 'waiting_on_agent') {
      await chatQueries.updateConversation(id, { status: 'waiting_on_customer' });
    }

    const io = req.app.get('io');
    if (io) {
      io.of('/chat-customer').to(`conv:${id}`).emit('new_message', msg);
      io.of('/chat-agent').to(`conv:${id}`).emit('new_message', msg);
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error('[Chat] agentSendMessage error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

async function agentUpdateConversation(req, res) {
  try {
    const { id } = req.params;
    const conv = await chatQueries.findConversationById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // If agent is closing, use closeConversation for proper tracking
    if (req.body.status === 'closed' && conv.status !== 'closed') {
      await chatQueries.closeConversation(id, 'agent');
    }
    const updated = await chatQueries.updateConversation(id, req.body);

    // Add system messages for changes
    const systemMessages = [];
    if (req.body.status && req.body.status !== conv.status) {
      if (req.body.status === 'closed') {
        systemMessages.push('Support agent closed this conversation');
      } else {
        systemMessages.push(`Status changed to ${req.body.status}`);
      }
    }
    if (req.body.priority && req.body.priority !== conv.priority) {
      systemMessages.push(`Priority changed to ${req.body.priority}`);
    }
    if (req.body.assignedAgentId !== undefined && req.body.assignedAgentId !== conv.assigned_agent_id) {
      systemMessages.push(req.body.assignedAgentId ? 'Conversation assigned to agent' : 'Conversation unassigned');
    }

    for (const text of systemMessages) {
      await chatQueries.addMessage({
        conversationId: id,
        senderType: 'system',
        senderId: null,
        content: text,
        messageType: 'system_event',
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.of('/chat-agent').emit('conversation_updated', updated);
      io.of('/chat-customer').to(`conv:${id}`).emit('conversation_updated', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('[Chat] agentUpdateConversation error:', err.message);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
}

async function editMessageHandler(req, res) {
  try {
    const { messageId } = req.params;
    const msg = await chatQueries.findMessageById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Verify sender owns the message
    const isCustomer = req.user && msg.sender_id === req.user.id && msg.sender_type === 'customer';
    const isAgent = req.admin && msg.sender_id === req.admin.id && msg.sender_type === 'agent';
    if (!isCustomer && !isAgent) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // 15-minute edit window
    const age = Date.now() - new Date(msg.created_at).getTime();
    if (age > 15 * 60 * 1000) {
      return res.status(400).json({ error: 'Messages can only be edited within 15 minutes' });
    }

    const updated = await chatQueries.updateMessage(messageId, {
      content: req.body.content,
      editedAt: new Date().toISOString(),
      originalContent: msg.original_content || msg.content,
    });

    const io = req.app.get('io');
    if (io) {
      io.of('/chat-agent').to(`conv:${msg.conversation_id}`).emit('message_edited', updated);
      io.of('/chat-customer').to(`conv:${msg.conversation_id}`).emit('message_edited', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('[Chat] editMessage error:', err.message);
    res.status(500).json({ error: 'Failed to edit message' });
  }
}

async function deleteMessageHandler(req, res) {
  try {
    const { messageId } = req.params;
    const msg = await chatQueries.findMessageById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const isCustomer = req.user && msg.sender_id === req.user.id && msg.sender_type === 'customer';
    const isAgent = req.admin && msg.sender_id === req.admin.id && msg.sender_type === 'agent';
    if (!isCustomer && !isAgent) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    const age = Date.now() - new Date(msg.created_at).getTime();
    if (age > 15 * 60 * 1000) {
      return res.status(400).json({ error: 'Messages can only be deleted within 15 minutes' });
    }

    const deleted = await chatQueries.softDeleteMessage(messageId);

    const io = req.app.get('io');
    if (io) {
      io.of('/chat-agent').to(`conv:${msg.conversation_id}`).emit('message_deleted', { id: messageId, conversationId: msg.conversation_id });
      io.of('/chat-customer').to(`conv:${msg.conversation_id}`).emit('message_deleted', { id: messageId, conversationId: msg.conversation_id });
    }

    res.json(deleted);
  } catch (err) {
    console.error('[Chat] deleteMessage error:', err.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
}

// ── Notes ──

async function agentAddNote(req, res) {
  try {
    const note = await chatQueries.addNote({
      conversationId: req.params.id,
      agentId: req.admin.id,
      content: req.body.content,
    });
    res.status(201).json(note);
  } catch (err) {
    console.error('[Chat] agentAddNote error:', err.message);
    res.status(500).json({ error: 'Failed to add note' });
  }
}

async function agentGetNotes(req, res) {
  try {
    const notes = await chatQueries.getNotes(req.params.id);
    res.json(notes);
  } catch (err) {
    console.error('[Chat] agentGetNotes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

// ── Canned Responses ──

async function getCannedResponses(req, res) {
  try {
    const responses = await chatQueries.findAllCannedResponses();
    res.json(responses);
  } catch (err) {
    console.error('[Chat] getCannedResponses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch canned responses' });
  }
}

async function createCannedResponse(req, res) {
  try {
    const response = await chatQueries.createCannedResponse(req.body);
    res.status(201).json(response);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Shortcut already exists' });
    }
    console.error('[Chat] createCannedResponse error:', err.message);
    res.status(500).json({ error: 'Failed to create canned response' });
  }
}

async function updateCannedResponse(req, res) {
  try {
    const updated = await chatQueries.updateCannedResponse(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Canned response not found' });
    res.json(updated);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Shortcut already exists' });
    }
    console.error('[Chat] updateCannedResponse error:', err.message);
    res.status(500).json({ error: 'Failed to update canned response' });
  }
}

async function deleteCannedResponse(req, res) {
  try {
    await chatQueries.deleteCannedResponse(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Chat] deleteCannedResponse error:', err.message);
    res.status(500).json({ error: 'Failed to delete canned response' });
  }
}

// ── Customer Close Conversation ──

async function customerCloseConversation(req, res) {
  try {
    const { id } = req.params;
    const conv = await chatQueries.findConversationById(id);
    if (!conv || conv.customer_id !== req.user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conv.status === 'closed') {
      return res.status(400).json({ error: 'This conversation is already closed' });
    }

    const updated = await chatQueries.closeConversation(id, 'customer');

    await chatQueries.addMessage({
      conversationId: id,
      senderType: 'system',
      senderId: null,
      content: 'Customer ended the conversation',
      messageType: 'system_event',
    });

    const io = req.app.get('io');
    if (io) {
      io.of('/chat-agent').emit('conversation_updated', { ...updated, closed_by: 'customer' });
      io.of('/chat-customer').to(`conv:${id}`).emit('conversation_updated', { ...updated, closed_by: 'customer' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[Chat] customerCloseConversation error:', err.message);
    res.status(500).json({ error: 'Failed to close conversation' });
  }
}

// ── Ratings ──

async function customerSubmitRating(req, res) {
  try {
    const { id } = req.params;
    const conv = await chatQueries.findConversationById(id);
    if (!conv || conv.customer_id !== req.user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conv.status !== 'closed') {
      return res.status(400).json({ error: 'You can only rate closed conversations' });
    }

    const existing = await chatQueries.findRatingByConversation(id);
    if (existing) {
      return res.status(400).json({ error: "You've already rated this conversation" });
    }

    const { rating, feedbackText } = req.body;
    const saved = await chatQueries.createRating({
      conversationId: id,
      customerId: req.user.id,
      rating,
      feedbackText,
    });

    const io = req.app.get('io');
    if (io) {
      const ratingPayload = {
        conversation_id: id,
        rating: saved.rating,
        feedback_text: saved.feedback_text,
        customer_name: conv.customer_name,
        rated_at: saved.created_at,
      };
      io.of('/chat-agent').emit('conversation_rated', ratingPayload);
      io.of('/chat-customer').to(`conv:${id}`).emit('conversation_rated', ratingPayload);
    }

    res.status(201).json(saved);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "You've already rated this conversation" });
    }
    console.error('[Chat] customerSubmitRating error:', err.message);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
}

async function customerGetRating(req, res) {
  try {
    const { id } = req.params;
    const conv = await chatQueries.findConversationById(id);
    if (!conv || conv.customer_id !== req.user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const rating = await chatQueries.findRatingByConversation(id);
    if (!rating) return res.status(404).json({ error: 'Not rated yet' });
    res.json(rating);
  } catch (err) {
    console.error('[Chat] customerGetRating error:', err.message);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
}

async function agentGetRating(req, res) {
  try {
    const rating = await chatQueries.findRatingByConversation(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Not rated yet' });
    res.json(rating);
  } catch (err) {
    console.error('[Chat] agentGetRating error:', err.message);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
}

async function agentGetRatingsSummary(req, res) {
  try {
    const summary = await chatQueries.getRatingsSummary();
    res.json(summary);
  } catch (err) {
    console.error('[Chat] agentGetRatingsSummary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch ratings summary' });
  }
}

module.exports = {
  customerGetConversations,
  customerCreateConversation,
  customerGetMessages,
  customerSendMessage,
  customerGetUnreadCount,
  customerCloseConversation,
  customerSubmitRating,
  customerGetRating,
  agentGetConversations,
  agentGetConversation,
  agentGetMessages,
  agentSendMessage,
  agentUpdateConversation,
  editMessageHandler,
  deleteMessageHandler,
  agentAddNote,
  agentGetNotes,
  agentGetRating,
  agentGetRatingsSummary,
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
};
