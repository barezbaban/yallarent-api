const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Read all migration files
  const migrationsDir = path.join(__dirname, '../../migrations');

  // Bootstrap: if _migrations is empty but DB already has tables,
  // mark all existing migrations as already applied
  const { rows: countRows } = await pool.query('SELECT COUNT(*) AS c FROM _migrations');
  if (parseInt(countRows[0].c, 10) === 0) {
    const { rows: tableCheck } = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') AS has_tables"
    );
    if (tableCheck[0].has_tables) {
      console.log('Migrations: bootstrapping tracker for existing database');
      const allFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      for (const file of allFiles) {
        await pool.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
      }
      console.log(`Migrations: marked ${allFiles.length} existing migrations as applied`);
      return;
    }
  }

  // Get already-executed migrations
  const { rows: executed } = await pool.query('SELECT name FROM _migrations ORDER BY name');
  const executedSet = new Set(executed.map((r) => r.name));
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranCount = 0;
  for (const file of files) {
    if (executedSet.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Migration applied: ${file}`);
      ranCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Migration failed: ${file}`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  if (ranCount === 0) {
    console.log('Migrations: all up to date');
  } else {
    console.log(`Migrations: ${ranCount} applied`);
  }
}

module.exports = { runMigrations };
