const pool = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT co.*,
            COUNT(c.id)::int AS car_count
     FROM companies co
     LEFT JOIN partners p ON p.id = co.id
     LEFT JOIN cars c ON c.company_id = co.id AND c.is_available = TRUE
     WHERE co.is_active = TRUE
       AND (p.id IS NULL OR p.status = 'active')
     GROUP BY co.id
     ORDER BY co.name`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT co.*,
            COUNT(c.id)::int AS car_count
     FROM companies co
     LEFT JOIN cars c ON c.company_id = co.id AND c.is_available = TRUE
     WHERE co.id = $1
     GROUP BY co.id`,
    [id]
  );
  return rows[0];
}

async function findCars(companyId) {
  const { rows } = await pool.query(
    `SELECT c.*, co.name AS company_name, co.city AS company_city
     FROM cars c
     JOIN companies co ON c.company_id = co.id
     WHERE c.company_id = $1 AND c.is_available = TRUE
     ORDER BY c.created_at DESC`,
    [companyId]
  );

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

  return rows;
}

module.exports = { findAll, findById, findCars };
