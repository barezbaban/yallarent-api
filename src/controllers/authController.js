const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const userQueries = require('../db/userQueries');
const { jwtSecret } = require('../config/env');
const emailService = require('../services/email');

// Default OTP that always works for fast testing
const DEFAULT_OTP = '123456';

// Generate a random 6-digit OTP
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Store OTP in database (with 60-second per-phone cooldown)
async function storeOtp(phone, otp) {
  try {
    // Prevent OTP spam: reject if one was sent in the last 60 seconds
    const { rows: recent } = await pool.query(
      `SELECT id FROM otp_codes
       WHERE phone = $1 AND used = FALSE AND created_at > NOW() - INTERVAL '60 seconds'`,
      [phone]
    );
    if (recent.length > 0) {
      return { throttled: true };
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at) VALUES ($1, $2, $3)`,
      [phone, otp, expiresAt]
    );
    return { throttled: false };
  } catch {
    // Table might not exist yet, fall back to memory
    resetTokens.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });
    return { throttled: false };
  }
}

// Verify OTP from database — accepts DEFAULT_OTP or the real one
async function checkOtp(phone, otp) {
  // Always accept the default OTP for testing
  if (otp === DEFAULT_OTP) return true;

  try {
    const { rows } = await pool.query(
      `SELECT id FROM otp_codes
       WHERE phone = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );
    if (rows.length > 0) {
      await pool.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [rows[0].id]);
      return true;
    }
  } catch {
    // Fall back to in-memory check
    const entry = resetTokens.get(phone);
    if (entry && entry.otp === otp && Date.now() <= entry.expires) {
      resetTokens.delete(phone);
      return true;
    }
  }
  return false;
}

// In-memory fallback store
const resetTokens = new Map();

async function signup(req, res) {
  try {
    const { fullName, phone, password, city, email, language } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: 'Full name, phone, and password are required' });
    }

    const existing = await userQueries.findByPhone(phone);
    if (existing && existing.is_verified) {
      return res.status(409).json({ error: 'Unable to create account with this phone number' });
    }

    if (existing && !existing.is_verified) {
      // Unverified account — update details and resend OTP
      const passwordHash = await bcrypt.hash(password, 10);
      await userQueries.updateUnverified(phone, { fullName, email, passwordHash, city });

      const otp = generateOtp();
      const otpResult = await storeOtp(phone, otp);
      if (!otpResult.throttled && emailService.isConfigured() && email) {
        emailService.sendOtp(email, otp, { name: fullName, language }).catch((err) => console.error('[Email] OTP send failed:', err.message));
      }

      return res.status(200).json({ message: 'Verification code resent. Please verify your phone number.', phone });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await userQueries.create({ fullName, phone, email, passwordHash, city });

    // Generate and store OTP
    const otp = generateOtp();
    const otpResult = await storeOtp(phone, otp);

    // Send OTP via email if not throttled and user provided one
    if (!otpResult.throttled && emailService.isConfigured() && email) {
      emailService.sendOtp(email, otp, { name: fullName, language }).catch((err) => console.error('[Email] OTP send failed:', err.message));
    }

    res.status(201).json({ message: 'Account created. Please verify your phone number.', phone });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function verifySignup(req, res) {
  try {
    const { phone, otp } = req.body;

    const valid = await checkOtp(phone, otp);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const user = await userQueries.markVerified(phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign({ id: user.id, role: 'user', jti: crypto.randomUUID() }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify account' });
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

    // Check if account is verified
    if (user.is_verified === false) {
      // Re-send OTP
      const otp = generateOtp();
      const otpResult = await storeOtp(phone, otp);
      if (!otpResult.throttled && emailService.isConfigured() && user.email) {
        emailService.sendOtp(user.email, otp, { name: user.full_name }).catch((err) => console.error('[Email] OTP send failed:', err.message));
      }
      return res.status(403).json({ error: 'Account not verified', phone, requiresVerification: true });
    }

    res.json({
      user: { id: user.id, full_name: user.full_name, phone: user.phone, email: user.email, city: user.city },
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

async function requestReset(req, res) {
  try {
    const { phone, language } = req.body;
    const user = await userQueries.findByPhone(phone);
    if (!user) {
      return res.json({ message: 'If this phone is registered, you will receive a code' });
    }

    const otp = generateOtp();
    const otpResult = await storeOtp(phone, otp);

    if (!otpResult.throttled && emailService.isConfigured() && user.email) {
      emailService.sendOtp(user.email, otp, { name: user.full_name, language }).catch((err) => console.error('[Email] OTP send failed:', err.message));
    }

    res.json({ message: 'If this phone is registered, you will receive a code' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    const valid = await checkOtp(phone, otp);
    if (!valid) {
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

module.exports = { signup, verifySignup, login, me, updateProfile, requestReset, verifyOtp, resetPassword };
