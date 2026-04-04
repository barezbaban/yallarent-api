const pool = require('../src/config/db');

async function resetDatabase() {
  await pool.query('DELETE FROM reviews');
  await pool.query('DELETE FROM favorites');
  await pool.query('DELETE FROM bookings');
  await pool.query('DELETE FROM cars');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM companies');

  // Re-seed with one company and one car
  await pool.query(`
    INSERT INTO companies (id, name, phone, city)
    VALUES ('a1000000-0000-0000-0000-000000000001', 'Test Company', '07501234567', 'Erbil')
  `);
  await pool.query(`
    INSERT INTO cars (id, company_id, make, model, year, price_per_day, city, description, is_available)
    VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla', 2023, 75000, 'Erbil', 'Test car', true)
  `);
}

async function closeDatabase() {
  await pool.end();
}

module.exports = { resetDatabase, closeDatabase, pool };
