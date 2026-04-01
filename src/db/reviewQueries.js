const pool = require('../config/db');

async function create({ bookingId, carId, userId, rating, reviewText }) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (booking_id, car_id, user_id, rating, review_text)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [bookingId, carId, userId, rating, reviewText || '']
  );
  return rows[0];
}

async function findByCarId(carId, { limit = 10, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.car_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [carId, limit, offset]
  );
  return rows;
}

async function findByBookingId(bookingId) {
  const { rows } = await pool.query(
    'SELECT * FROM reviews WHERE booking_id = $1',
    [bookingId]
  );
  return rows[0] || null;
}

async function getCarRatingStats(carId) {
  const { rows } = await pool.query(
    `SELECT AVG(rating)::numeric(3,1) AS average_rating, COUNT(*)::int AS review_count
     FROM reviews WHERE car_id = $1`,
    [carId]
  );
  return {
    averageRating: rows[0].average_rating ? parseFloat(rows[0].average_rating) : null,
    reviewCount: rows[0].review_count || 0,
  };
}

module.exports = { create, findByCarId, findByBookingId, getCarRatingStats };
