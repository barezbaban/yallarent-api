const pool = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(`
    SELECT r.*,
      (SELECT COUNT(*)::int FROM backoffice_users bu WHERE bu.role_id = r.id) AS user_count
    FROM roles r
    ORDER BY r.created_at ASC
  `);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
  return rows[0];
}

async function findByName(name) {
  const { rows } = await pool.query('SELECT * FROM roles WHERE name = $1', [name]);
  return rows[0];
}

async function create({ name, description, permissions }) {
  const { rows } = await pool.query(
    `INSERT INTO roles (name, description, permissions)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, description || '', permissions]
  );
  return rows[0];
}

async function update(id, { name, description, permissions }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
  if (permissions !== undefined) { fields.push(`permissions = $${idx++}`); values.push(JSON.stringify(permissions)); }
  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) return findById(id); // only updated_at

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE roles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM roles WHERE id = $1', [id]);
}

async function getUserCount(id) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM backoffice_users WHERE role_id = $1',
    [id]
  );
  return rows[0].count;
}

module.exports = { findAll, findById, findByName, create, update, remove, getUserCount };
