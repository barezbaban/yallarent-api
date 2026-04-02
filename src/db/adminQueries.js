const pool = require('../config/db');

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, role, is_active, created_at FROM admins WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function dashboardStats() {
  const [users, bookings, revenue, cars] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM users'),
    pool.query("SELECT COUNT(*)::int AS count FROM bookings WHERE status = 'confirmed'"),
    pool.query("SELECT COALESCE(SUM(total_price), 0)::bigint AS total FROM bookings WHERE status IN ('confirmed', 'completed')"),
    pool.query("SELECT COUNT(*)::int AS count FROM cars WHERE is_available = TRUE"),
  ]);

  return {
    totalUsers: users.rows[0].count,
    activeBookings: bookings.rows[0].count,
    totalRevenue: Number(revenue.rows[0].total),
    activeCars: cars.rows[0].count,
  };
}

async function recentBookings(limit = 5) {
  const { rows } = await pool.query(
    `SELECT b.id, b.start_date, b.end_date, b.total_price, b.status, b.created_at,
            u.full_name AS renter_name,
            c.make || ' ' || c.model AS car_name
     FROM bookings b
     JOIN users u ON u.id = b.renter_id
     JOIN cars c ON c.id = b.car_id
     ORDER BY b.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function recentUsers(limit = 5) {
  const { rows } = await pool.query(
    `SELECT id, full_name, phone, email, city, is_verified, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { findByEmail, findById, dashboardStats, recentBookings, recentUsers };
