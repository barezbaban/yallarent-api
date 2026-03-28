const pool = require('../config/db');

async function create({ carId, renterId, startDate, endDate, totalPrice }) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (car_id, renter_id, start_date, end_date, total_price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [carId, renterId, startDate, endDate, totalPrice]
  );
  return rows[0];
}

async function findByRenter(renterId) {
  const { rows } = await pool.query(
    `SELECT b.*, c.make, c.model, c.year, c.image_url, co.name AS company_name
     FROM bookings b
     JOIN cars c ON b.car_id = c.id
     JOIN companies co ON c.company_id = co.id
     WHERE b.renter_id = $1
     ORDER BY b.created_at DESC`,
    [renterId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT b.*, c.make, c.model, c.year, c.image_url, c.price_per_day,
            co.name AS company_name, co.city AS company_city
     FROM bookings b
     JOIN cars c ON b.car_id = c.id
     JOIN companies co ON c.company_id = co.id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
}

async function hasOverlap(carId, startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT id FROM bookings
     WHERE car_id = $1
       AND status != 'cancelled'
       AND start_date < $3
       AND end_date > $2`,
    [carId, startDate, endDate]
  );
  return rows.length > 0;
}

async function cancel(id) {
  const { rows } = await pool.query(
    `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}

module.exports = { create, findByRenter, findById, hasOverlap, cancel };
