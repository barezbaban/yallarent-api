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

// Default OTP code — replace with real SMS/WhatsApp provider later
const DEFAULT_OTP = '123456';

// In-memory store for reset tokens (swap for Redis/DB in production)
const resetTokens = new Map();

async function requestReset(req, res) {
  try {
    const { phone } = req.body;
    const user = await userQueries.findByPhone(phone);
    if (!user) {
      // Don't reveal whether phone exists
      return res.json({ message: 'If this phone is registered, you will receive a code' });
    }

    // Store OTP with 10-minute expiry
    resetTokens.set(phone, { otp: DEFAULT_OTP, expires: Date.now() + 10 * 60 * 1000 });

    // TODO: Send OTP via WhatsApp/SMS here
    res.json({ message: 'If this phone is registered, you will receive a code' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    const entry = resetTokens.get(phone);

    if (!entry || entry.otp !== otp || Date.now() > entry.expires) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Generate a short-lived reset token
    const resetToken = crypto.randomUUID();
    resetTokens.set(phone, { resetToken, expires: Date.now() + 5 * 60 * 1000 });

    res.json({ resetToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify code' });
  }
}

async function resetPassword(req, res) {
  try {
    const { phone, resetToken, newPassword } = req.body;
    const entry = resetTokens.get(phone);

    if (!entry || entry.resetToken !== resetToken || Date.now() > entry.expires) {
      return res.status(400).json({ error: 'Invalid or expired reset session' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await userQueries.updatePassword(phone, passwordHash);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    resetTokens.delete(phone);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = { signup, login, me, updateProfile, requestReset, verifyOtp, resetPassword };
