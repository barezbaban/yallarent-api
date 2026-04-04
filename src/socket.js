const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret, allowedOrigins, nodeEnv } = require('./config/env');

function setupSocket(httpServer, app) {
  const corsOpts = ['production', 'staging'].includes(nodeEnv) && allowedOrigins.length > 0
    ? { origin: allowedOrigins, methods: ['GET', 'POST'] }
    : { origin: '*' };

  const io = new Server(httpServer, { cors: corsOpts });

  // Store io on express app for use in controllers
  app.set('io', io);

  // ── Customer namespace ──
  const customerNs = io.of('/chat-customer');
  customerNs.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  customerNs.on('connection', (socket) => {
    const userId = socket.user.id;

    // Join personal room for broadcast targeting
    socket.join(`user:${userId}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing', ({ conversationId }) => {
      // Broadcast to agents watching this conversation
      io.of('/chat-agent').to(`conv:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        senderType: 'customer',
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      io.of('/chat-agent').to(`conv:${conversationId}`).emit('stop_typing', {
        conversationId,
        userId,
        senderType: 'customer',
      });
    });
  });

  // ── Agent namespace ──
  const agentNs = io.of('/chat-agent');
  agentNs.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      if (payload.type !== 'backoffice' && payload.role !== 'admin' && payload.role !== 'superadmin') {
        return next(new Error('Admin access required'));
      }
      socket.admin = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  agentNs.on('connection', (socket) => {
    const agentId = socket.admin.id;

    socket.join(`agent:${agentId}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing', ({ conversationId }) => {
      // Broadcast to customer watching this conversation
      io.of('/chat-customer').to(`conv:${conversationId}`).emit('typing', {
        conversationId,
        agentId,
        senderType: 'agent',
      });
      // Also broadcast to other agents
      socket.to(`conv:${conversationId}`).emit('typing', {
        conversationId,
        agentId,
        senderType: 'agent',
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      io.of('/chat-customer').to(`conv:${conversationId}`).emit('stop_typing', {
        conversationId,
        agentId,
        senderType: 'agent',
      });
      socket.to(`conv:${conversationId}`).emit('stop_typing', {
        conversationId,
        agentId,
        senderType: 'agent',
      });
    });
  });

  return io;
}

module.exports = { setupSocket };
