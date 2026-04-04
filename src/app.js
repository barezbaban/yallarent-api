const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { allowedOrigins, nodeEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const companyRoutes = require('./routes/companyRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const supportRoutes = require('./routes/supportRoutes');
const portalRoutes = require('./routes/portalRoutes');
const backofficeRoutes = require('./routes/backofficeRoutes');
const { customerRouter: chatCustomerRoutes, agentRouter: chatAgentRoutes } = require('./routes/chatRoutes');

const app = express();

// Trust Railway's reverse proxy so rate limiter gets real client IPs
app.set('trust proxy', 1);

app.use(helmet());
if (nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Restrict CORS in production and staging. Open in dev/test only.
app.use(cors(
  ['production', 'staging'].includes(nodeEnv) && allowedOrigins.length > 0
    ? { origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
    : {}
));
app.use(express.json({ limit: '10kb' }));

// Global rate limit: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Strict rate limit for auth endpoints: 10 requests per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/request-reset', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/verify-signup', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/backoffice', backofficeRoutes);
// Track chat requests for debugging
let chatRequestLog = [];
app.use('/api/chat', (req, res, next) => {
  chatRequestLog.push({ method: req.method, path: req.path, time: new Date().toISOString(), auth: !!req.headers.authorization });
  if (chatRequestLog.length > 20) chatRequestLog = chatRequestLog.slice(-20);
  next();
});

app.use('/api/chat', chatCustomerRoutes);
app.use('/api/agent/chat', chatAgentRoutes);

// Serve uploaded chat files
app.use('/uploads/chat', express.static(path.join(__dirname, '..', 'uploads', 'chat')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'chat-v3', chatRequests: chatRequestLog });
});

// Serve backoffice portal static files
const portalDir = path.join(__dirname, '..', 'portal', 'dist');
app.use('/portal', express.static(portalDir));
app.get('/portal/{*splat}', (req, res) => {
  res.sendFile(path.join(portalDir, 'index.html'));
});

module.exports = app;
