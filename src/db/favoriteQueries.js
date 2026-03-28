const pool = require('../config/db');

async function findByUser(userId) {
  const { rows } = await pool.query(
    `SELECT f.id, f.car_id, f.created_at,
            c.make, c.model, c.year, c.price_per_day, c.city, c.image_url,
            co.name AS company_name
     FROM favorites f
     JOIN cars c ON f.car_id = c.id
     JOIN companies co ON c.company_id = co.id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

async function add(userId, carId) {
  const { rows } = await pool.query(
    `INSERT INTO favorites (user_id, car_id) VALUES ($1, $2)
     ON CONFLICT (user_id, car_id) DO NOTHING
     RETURNING *`,
    [userId, carId]
  );
  return rows[0];
}

async function remove(userId, carId) {
  const { rowCount } = await pool.query(
    `DELETE FROM favorites WHERE user_id = $1 AND car_id = $2`,
    [userId, carId]
  );
  return rowCount > 0;
}

async function getCarIds(userId) {
  const { rows } = await pool.query(
    `SELECT car_id FROM favorites WHERE user_id = $1`,
    [userId]
  );
  return rows.map((r) => r.car_id);
}

module.exports = { findByUser, add, remove, getCarIds };
