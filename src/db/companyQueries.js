const pool = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT * FROM companies WHERE is_active = TRUE ORDER BY name'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
  return rows[0];
}

module.exports = { findAll, findById };
