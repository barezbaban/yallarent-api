const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userQueries = require('../db/userQueries');
const { jwtSecret } = require('../config/env');

async function signup(req, res) {
  try {
    const { fullName, phone, password, city } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: 'Full name, phone, and password are required' });
    }

    const existing = await userQueries.findByPhone(phone);
    if (existing) {
      return res.status(409).json({ error: 'Unable to create account with this phone number' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userQueries.create({ fullName, phone, passwordHash, city });

    const token = jwt.sign({ id: user.id, role: 'user', jti: crypto.randomUUID() }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const user = await userQueries.findByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${minutes} minute(s)` });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await userQueries.incrementFailedAttempts(phone);
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Reset failed attempts on successful login
    await userQueries.resetFailedAttempts(phone);

    const token = jwt.sign({ id: user.id, role: 'user', jti: crypto.randomUUID() }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });

    res.json({
      user: { id: user.id, full_name: user.full_name, phone: user.phone, city: user.city },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const user = await userQueries.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function updateProfile(req, res) {
  try {
    const { fullName, city } = req.body;
    const user = await userQueries.update(req.user.id, { fullName, city });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = { signup, login, me, updateProfile };
