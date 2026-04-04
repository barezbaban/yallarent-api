const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminQueries = require('../db/adminQueries');
const { jwtSecret } = require('../config/env');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await adminQueries.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role, jti: crypto.randomUUID() },
      jwtSecret,
      { expiresIn: '8h', algorithm: 'HS256' }
    );

    res.json({
      admin: { id: admin.id, email: admin.email, fullName: admin.full_name, role: admin.role },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const admin = await adminQueries.findById(req.admin.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function dashboard(req, res) {
  try {
    const [stats, bookings, users] = await Promise.all([
      adminQueries.dashboardStats(),
      adminQueries.recentBookings(5),
      adminQueries.recentUsers(5),
    ]);

    res.json({ stats, recentBookings: bookings, recentUsers: users });
  } catch (err) {
    console.error('[Dashboard Error]', err.message);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
}

module.exports = { login, me, dashboard };
