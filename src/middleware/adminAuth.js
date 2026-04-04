const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (payload.type !== 'backoffice' && payload.role !== 'admin' && payload.role !== 'superadmin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = adminAuth;
