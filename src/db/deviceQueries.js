const pool = require('../config/db');

async function register(userId, pushToken, platform = 'ios') {
  const { rows } = await pool.query(
    `INSERT INTO user_devices (user_id, push_token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, push_token) DO UPDATE SET platform = $3
     RETURNING *`,
    [userId, pushToken, platform]
  );
  return rows[0];
}

async function unregister(userId, pushToken) {
  await pool.query(
    `DELETE FROM user_devices WHERE user_id = $1 AND push_token = $2`,
    [userId, pushToken]
  );
}

async function findByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_devices WHERE user_id = $1`,
    [userId]
  );
  return rows;
}

module.exports = { register, unregister, findByUserId };
