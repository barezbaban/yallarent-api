const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const backofficeUserQueries = require('../db/backofficeUserQueries');
const { jwtSecret } = require('../config/env');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await backofficeUserQueries.findByLogin(username);
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
        role: user.role_name?.toLowerCase() === 'super admin' ? 'superadmin' : undefined,
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
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        permissions: user.permissions || {},
      },
      token,
      mustChangePassword: user.must_change_password,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await backofficeUserQueries.findById(req.admin.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await backofficeUserQueries.updatePassword(req.admin.id, passwordHash);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
}

async function me(req, res) {
  try {
    const user = await backofficeUserQueries.findById(req.admin.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: user.role_name,
      permissions: user.permissions || {},
      isActive: user.is_active,
      lastLogin: user.last_login,
      mustChangePassword: user.must_change_password,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = { login, changePassword, me };
