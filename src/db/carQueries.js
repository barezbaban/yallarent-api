const pool = require('../config/db');

async function findAll({ city, minPrice, maxPrice, category, transmission, minPassengers, minLuggage, page = 1, limit = 20 } = {}) {
  let query = `
    SELECT c.*, co.name AS company_name, co.city AS company_city
    FROM cars c
    JOIN companies co ON c.company_id = co.id
    LEFT JOIN partners p ON c.partner_id = p.id
    WHERE c.is_available = TRUE
      AND (p.id IS NULL OR p.status = 'active')
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
    const categories = category.split(',').map((c) => c.trim()).filter(Boolean);
    if (categories.length === 1) {
      params.push(categories[0]);
      query += ` AND c.category = $${params.length}`;
    } else if (categories.length > 1) {
      params.push(categories);
      query += ` AND c.category = ANY($${params.length})`;
    }
  }
  if (transmission) {
    params.push(transmission);
    query += ` AND c.transmission = $${params.length}`;
  }
  if (minPassengers) {
    params.push(minPassengers);
    query += ` AND c.passengers >= $${params.length}`;
  }
  if (minLuggage) {
    params.push(minLuggage);
    query += ` AND c.luggage >= $${params.length}`;
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

  // Attach rating stats in batch (graceful if reviews table doesn't exist yet)
  if (rows.length > 0) {
    try {
      const ids = rows.map((r) => r.id);
      const { rows: ratingRows } = await pool.query(
        `SELECT car_id, AVG(rating)::numeric(3,1) AS average_rating, COUNT(*)::int AS review_count
         FROM reviews WHERE car_id = ANY($1) GROUP BY car_id`,
        [ids]
      );
      const ratingsMap = Object.fromEntries(ratingRows.map((r) => [r.car_id, r]));
      for (const car of rows) {
        car.average_rating = ratingsMap[car.id]?.average_rating ? parseFloat(ratingsMap[car.id].average_rating) : null;
        car.review_count = ratingsMap[car.id]?.review_count || 0;
      }
    } catch {
      for (const car of rows) {
        car.average_rating = null;
        car.review_count = 0;
      }
    }
  }

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

  // Attach rating stats (graceful if reviews table doesn't exist yet)
  try {
    const { rows: ratingRows } = await pool.query(
      `SELECT AVG(rating)::numeric(3,1) AS average_rating, COUNT(*)::int AS review_count
       FROM reviews WHERE car_id = $1`,
      [id]
    );
    rows[0].average_rating = ratingRows[0].average_rating ? parseFloat(ratingRows[0].average_rating) : null;
    rows[0].review_count = ratingRows[0].review_count || 0;
  } catch {
    rows[0].average_rating = null;
    rows[0].review_count = 0;
  }

  return rows[0];
}

module.exports = { findAll, findById };
