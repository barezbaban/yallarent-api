const { Pool } = require('pg');
const { databaseUrl, nodeEnv } = require('./env');

const pool = new Pool({
  connectionString: databaseUrl,
  ...(nodeEnv === 'production' && {
    ssl: { rejectUnauthorized: false },
  }),
});

module.exports = pool;
