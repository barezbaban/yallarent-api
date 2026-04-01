const express = require('express');
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
