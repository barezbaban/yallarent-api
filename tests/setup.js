const pool = require('../src/config/db');

async function resetDatabase() {
  // Truncate all known tables; use DO block to skip missing ones gracefully
  await pool.query(`
    DO $$ BEGIN
      EXECUTE (
        SELECT 'TRUNCATE ' || string_agg(quote_ident(tablename), ', ') || ' RESTART IDENTITY CASCADE'
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('_migrations')
          AND tablename NOT LIKE 'pg_%'
      );
    END $$;
  `);

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
