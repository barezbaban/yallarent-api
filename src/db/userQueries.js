const pool = require('../config/db');

async function findByPhone(phone) {
  const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0];
}

async function create({ fullName, phone, passwordHash, city }) {
  const { rows } = await pool.query(
    'INSERT INTO users (full_name, phone, password_hash, city) VALUES ($1, $2, $3, $4) RETURNING id, full_name, phone, city, created_at',
    [fullName, phone, passwordHash, city]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, full_name, phone, city, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

module.exports = { findByPhone, create, findById };
