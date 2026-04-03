const pool = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(`
    SELECT bu.id, bu.full_name, bu.email, bu.is_active, bu.last_login, bu.created_at, bu.updated_at,
           bu.role_id, r.name AS role_name
    FROM backoffice_users bu
    JOIN roles r ON r.id = bu.role_id
    ORDER BY bu.created_at ASC
  `);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`
    SELECT bu.id, bu.full_name, bu.email, bu.is_active, bu.last_login, bu.created_at, bu.updated_at,
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

async function create({ fullName, email, passwordHash, roleId }) {
  const { rows } = await pool.query(
    `INSERT INTO backoffice_users (full_name, email, password_hash, role_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role_id, is_active, created_at`,
    [fullName, email, passwordHash, roleId]
  );
  return rows[0];
}

async function update(id, { fullName, email, roleId, isActive }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(fullName); }
  if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
  if (roleId !== undefined) { fields.push(`role_id = $${idx++}`); values.push(roleId); }
  if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }
  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) return findById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE backoffice_users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, full_name, email, role_id, is_active, last_login, created_at, updated_at`,
    values
  );
  return rows[0];
}

async function updatePassword(id, passwordHash) {
  await pool.query(
    'UPDATE backoffice_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, id]
  );
}

async function updateLastLogin(id) {
  await pool.query(
    'UPDATE backoffice_users SET last_login = NOW() WHERE id = $1',
    [id]
  );
}

module.exports = { findAll, findById, findByEmail, create, update, updatePassword, updateLastLogin };
