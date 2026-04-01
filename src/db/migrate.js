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

  // Get already-executed migrations
  const { rows: executed } = await pool.query('SELECT name FROM _migrations ORDER BY name');
  const executedSet = new Set(executed.map((r) => r.name));

  // Read all migration files
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranCount = 0;
  for (const file of files) {
    if (executedSet.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`Migration applied: ${file}`);
      ranCount++;
    } catch (err) {
      console.error(`Migration failed: ${file}`, err.message);
      throw err;
    }
  }

  if (ranCount === 0) {
    console.log('Migrations: all up to date');
  } else {
    console.log(`Migrations: ${ranCount} applied`);
  }
}

module.exports = { runMigrations };
