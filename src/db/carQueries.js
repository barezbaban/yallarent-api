const pool = require('../config/db');

async function findAll({ city, minPrice, maxPrice, category, page = 1, limit = 20 } = {}) {
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
  if (category) {
    params.push(category);
    query += ` AND c.category = $${params.length}`;
  }

  // Count total before pagination
  const countQuery = query.replace(/SELECT c\.\*, co\.name AS company_name, co\.city AS company_city/, 'SELECT COUNT(*) AS total');
  const { rows: countRows } = await pool.query(countQuery, params);
  const total = parseInt(countRows[0].total, 10);

  query += ' ORDER BY c.created_at DESC';
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push((page - 1) * limit);
  query += ` OFFSET $${params.length}`;

  const { rows } = await pool.query(query, params);
  return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT c.*, co.name AS company_name, co.city AS company_city, co.phone AS company_phone, co.address AS company_address
     FROM cars c
     JOIN companies co ON c.company_id = co.id
     WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const { rows: imageRows } = await pool.query(
    `SELECT id, image_url, display_order FROM car_images WHERE car_id = $1 ORDER BY display_order`,
    [id]
  );
  rows[0].images = imageRows;
  return rows[0];
}

module.exports = { findAll, findById };
