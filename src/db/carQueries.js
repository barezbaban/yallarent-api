const pool = require('../config/db');

async function findAll({ city, minPrice, maxPrice } = {}) {
  let query = `
    SELECT c.*, co.name AS company_name, co.city AS company_city
    FROM cars c
    JOIN companies co ON c.company_id = co.id
    WHERE c.is_available = TRUE
  `;
  const params = [];

  if (city) {
    params.push(city);
    query += ` AND c.city = $${params.length}`;
  }
  if (minPrice) {
    params.push(minPrice);
    query += ` AND c.price_per_day >= $${params.length}`;
  }
  if (maxPrice) {
    params.push(maxPrice);
    query += ` AND c.price_per_day <= $${params.length}`;
  }

  query += ' ORDER BY c.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT c.*, co.name AS company_name, co.city AS company_city, co.phone AS company_phone
     FROM cars c
     JOIN companies co ON c.company_id = co.id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0];
}

module.exports = { findAll, findById };
