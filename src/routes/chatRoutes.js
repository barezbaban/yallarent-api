const { Router } = require('express');
const chatController = require('../controllers/chatController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const schemas = require('../schemas');
const { chatUpload } = require('../middleware/upload');

// ── Customer routes ──
const customerRouter = Router();

// Debug ping - no auth required
customerRouter.get('/ping', (req, res) => {
  res.json({ ok: true, route: 'chat-customer', time: new Date().toISOString() });
});

customerRouter.use(authenticate);

customerRouter.use((req, res, next) => { console.log('[Chat Route]', req.method, req.path, 'user:', req.user?.id); next(); });
customerRouter.get('/conversations', chatController.customerGetConversations);
customerRouter.post('/conversations', validate(schemas.createConversation), chatController.customerCreateConversation);
customerRouter.get('/conversations/:id/messages', validateParams(schemas.uuidParam), validateQuery(schemas.chatMessagesQuery), chatController.customerGetMessages);
customerRouter.post('/conversations/:id/messages', validateParams(schemas.uuidParam), chatUpload.single('file'), validate(schemas.sendChatMessage), chatController.customerSendMessage);
customerRouter.get('/unread', chatController.customerGetUnreadCount);

// Edit / delete own messages
customerRouter.patch('/messages/:messageId', validate(schemas.editMessage), chatController.editMessageHandler);
customerRouter.delete('/messages/:messageId', chatController.deleteMessageHandler);

// ── Agent routes ──
const agentRouter = Router();
agentRouter.use(adminAuth);

agentRouter.get('/conversations', validateQuery(schemas.conversationListQuery), chatController.agentGetConversations);
agentRouter.get('/conversations/:id', validateParams(schemas.uuidParam), chatController.agentGetConversation);
agentRouter.patch('/conversations/:id', validateParams(schemas.uuidParam), validate(schemas.updateConversationSchema), chatController.agentUpdateConversation);
agentRouter.get('/conversations/:id/messages', validateParams(schemas.uuidParam), validateQuery(schemas.chatMessagesQuery), chatController.agentGetMessages);
agentRouter.post('/conversations/:id/messages', validateParams(schemas.uuidParam), chatUpload.single('file'), validate(schemas.sendChatMessage), chatController.agentSendMessage);

// Notes
agentRouter.get('/conversations/:id/notes', validateParams(schemas.uuidParam), chatController.agentGetNotes);
agentRouter.post('/conversations/:id/notes', validateParams(schemas.uuidParam), validate(schemas.addChatNote), chatController.agentAddNote);

// Edit / delete own messages
agentRouter.patch('/messages/:messageId', validate(schemas.editMessage), chatController.editMessageHandler);
agentRouter.delete('/messages/:messageId', chatController.deleteMessageHandler);

// Canned responses
agentRouter.get('/canned-responses', chatController.getCannedResponses);
agentRouter.post('/canned-responses', validate(schemas.createCannedResponseSchema), chatController.createCannedResponse);
agentRouter.patch('/canned-responses/:id', validateParams(schemas.uuidParam), validate(schemas.updateCannedResponseSchema), chatController.updateCannedResponse);
agentRouter.delete('/canned-responses/:id', validateParams(schemas.uuidParam), chatController.deleteCannedResponse);

module.exports = { customerRouter, agentRouter };
