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
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userQueries.create({ fullName, phone, passwordHash, city });

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '30d' });

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

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '30d' });

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

module.exports = { signup, login, me };
