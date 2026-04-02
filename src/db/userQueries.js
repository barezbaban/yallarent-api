const pool = require('../config/db');

async function findByPhone(phone) {
  const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0];
}

async function create({ fullName, phone, email, passwordHash, city }) {
  const { rows } = await pool.query(
    'INSERT INTO users (full_name, phone, email, password_hash, city, is_verified) VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id, full_name, phone, email, city, created_at',
    [fullName, phone, email || '', passwordHash, city]
  );
  return rows[0];
}

async function markVerified(phone) {
  const { rows } = await pool.query(
    'UPDATE users SET is_verified = TRUE WHERE phone = $1 RETURNING id, full_name, phone, email, city',
    [phone]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, full_name, phone, email, city, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function update(id, { fullName, city }) {
  const { rows } = await pool.query(
    `UPDATE users SET full_name = COALESCE($2, full_name), city = COALESCE($3, city)
     WHERE id = $1
     RETURNING id, full_name, phone, city, created_at`,
    [id, fullName, city]
  );
  return rows[0];
}

async function incrementFailedAttempts(phone) {
  const { rows } = await pool.query(
    `UPDATE users SET failed_login_attempts = failed_login_attempts + 1,
       locked_until = CASE WHEN failed_login_attempts + 1 >= 5
         THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
     WHERE phone = $1
     RETURNING failed_login_attempts, locked_until`,
    [phone]
  );
  return rows[0];
}

async function resetFailedAttempts(phone) {
  await pool.query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE phone = $1',
    [phone]
  );
}

async function updatePassword(phone, passwordHash) {
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $2, failed_login_attempts = 0, locked_until = NULL
     WHERE phone = $1
     RETURNING id, full_name, phone, city`,
    [phone, passwordHash]
  );
  return rows[0];
}

async function updateUnverified(phone, { fullName, email, passwordHash, city }) {
  await pool.query(
    `UPDATE users SET full_name = $2, email = $3, password_hash = $4, city = $5
     WHERE phone = $1 AND is_verified = FALSE`,
    [phone, fullName, email || '', passwordHash, city || '']
  );
}

module.exports = { findByPhone, create, findById, update, incrementFailedAttempts, resetFailedAttempts, updatePassword, markVerified, updateUnverified };
