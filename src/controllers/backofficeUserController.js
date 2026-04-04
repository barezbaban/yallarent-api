const crypto = require('crypto');
const bcrypt = require('bcrypt');
const backofficeUserQueries = require('../db/backofficeUserQueries');
const roleQueries = require('../db/roleQueries');

function generatePassword() {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = lower + upper + digits + symbols;

  let password = '';
  password += lower[crypto.randomInt(lower.length)];
  password += upper[crypto.randomInt(upper.length)];
  password += digits[crypto.randomInt(digits.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  for (let i = 4; i < 12; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

function generateUsername(fullName) {
  return fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.');
}

async function list(req, res) {
  try {
    const users = await backofficeUserQueries.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function getById(req, res) {
  try {
    const user = await backofficeUserQueries.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      fullName: user.full_name,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role_name,
      isActive: user.is_active,
      mustChangePassword: user.must_change_password,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function create(req, res) {
  try {
    const { fullName, username, email, roleId } = req.body;

    // Generate username from name if not provided
    let finalUsername = username || generateUsername(fullName);

    // Ensure username is unique
    let suffix = 0;
    let candidate = finalUsername;
    while (await backofficeUserQueries.usernameExists(candidate)) {
      suffix++;
      candidate = `${finalUsername}.${suffix}`;
    }
    finalUsername = candidate;

    // Check email uniqueness if provided
    if (email) {
      const existing = await backofficeUserQueries.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
    }

    const role = await roleQueries.findById(roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const user = await backofficeUserQueries.create({ fullName, username: finalUsername, email, passwordHash, roleId });

    res.status(201).json({
      id: user.id,
      fullName: user.full_name,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      roleName: role.name,
      generatedPassword: plainPassword,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}

async function update(req, res) {
  try {
    const user = await backofficeUserQueries.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.username && req.body.username !== user.username) {
      const taken = await backofficeUserQueries.usernameExists(req.body.username, req.params.id);
      if (taken) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }

    if (req.body.email && req.body.email !== user.email) {
      const existing = await backofficeUserQueries.findByEmail(req.body.email);
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
    }

    if (req.body.roleId) {
      const role = await roleQueries.findById(req.body.roleId);
      if (!role) return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await backofficeUserQueries.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function resetPassword(req, res) {
  try {
    const user = await backofficeUserQueries.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    await backofficeUserQueries.resetPassword(req.params.id, passwordHash);

    res.json({
      username: user.username,
      email: user.email,
      generatedPassword: plainPassword,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = { list, getById, create, update, resetPassword };
