const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const backofficeUserQueries = require('../db/backofficeUserQueries');
const { jwtSecret } = require('../config/env');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await backofficeUserQueries.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await backofficeUserQueries.updateLastLogin(user.id);

    const token = jwt.sign(
      {
        id: user.id,
        role_id: user.role_id,
        permissions: user.permissions || {},
        type: 'backoffice',
        jti: crypto.randomUUID(),
      },
      jwtSecret,
      { expiresIn: '8h', algorithm: 'HS256' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        permissions: user.permissions || {},
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const user = await backofficeUserQueries.findById(req.admin.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: user.role_name,
      permissions: user.permissions || {},
      isActive: user.is_active,
      lastLogin: user.last_login,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = { login, me };
