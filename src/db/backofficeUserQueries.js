const pool = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(`
    SELECT bu.id, bu.full_name, bu.username, bu.email, bu.is_active, bu.must_change_password,
           bu.last_login, bu.created_at, bu.updated_at,
           bu.role_id, r.name AS role_name
    FROM backoffice_users bu
    JOIN roles r ON r.id = bu.role_id
    ORDER BY bu.created_at ASC
  `);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`
    SELECT bu.id, bu.full_name, bu.username, bu.email, bu.is_active, bu.must_change_password,
           bu.last_login, bu.created_at, bu.updated_at,
           bu.role_id, r.name AS role_name, r.permissions
    FROM backoffice_users bu
    JOIN roles r ON r.id = bu.role_id
    WHERE bu.id = $1
  `, [id]);
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(`
    SELECT bu.*, r.name AS role_name, r.permissions
    FROM backoffice_users bu
    JOIN roles r ON r.id = bu.role_id
    WHERE bu.email = $1
  `, [email]);
  return rows[0];
}

async function findByUsername(username) {
  const { rows } = await pool.query(`
    SELECT bu.*, r.name AS role_name, r.permissions
    FROM backoffice_users bu
    JOIN roles r ON r.id = bu.role_id
    WHERE bu.username = $1
  `, [username]);
  return rows[0];
}

async function findByLogin(login) {
  // Try username first, then email
  const user = await findByUsername(login);
  if (user) return user;
  if (login.includes('@')) return findByEmail(login);
  return null;
}

async function create({ fullName, username, email, passwordHash, roleId }) {
  const { rows } = await pool.query(
    `INSERT INTO backoffice_users (full_name, username, email, password_hash, role_id, must_change_password)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING id, full_name, username, email, role_id, is_active, must_change_password, created_at`,
    [fullName, username, email || null, passwordHash, roleId]
  );
  return rows[0];
}

async function update(id, { fullName, username, email, roleId, isActive }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(fullName); }
  if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
  if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email || null); }
  if (roleId !== undefined) { fields.push(`role_id = $${idx++}`); values.push(roleId); }
  if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }
  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) return findById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE backoffice_users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, full_name, username, email, role_id, is_active, must_change_password, last_login, created_at, updated_at`,
    values
  );
  return rows[0];
}

async function updatePassword(id, passwordHash) {
  await pool.query(
    'UPDATE backoffice_users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2',
    [passwordHash, id]
  );
}

async function resetPassword(id, passwordHash) {
  await pool.query(
    'UPDATE backoffice_users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW() WHERE id = $2',
    [passwordHash, id]
  );
}

async function updateLastLogin(id) {
  await pool.query(
    'UPDATE backoffice_users SET last_login = NOW() WHERE id = $1',
    [id]
  );
}

async function usernameExists(username, excludeId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM backoffice_users WHERE username = $1 ${excludeId ? 'AND id != $2' : ''} LIMIT 1`,
    excludeId ? [username, excludeId] : [username]
  );
  return rows.length > 0;
}

module.exports = { findAll, findById, findByEmail, findByUsername, findByLogin, create, update, updatePassword, resetPassword, updateLastLogin, usernameExists };
