// backend/src/db.js

const { Pool } = require('pg');

// Load these from your .env or however you have them set:
const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,
});

// Whenever a client is checked out, force its session into Dhaka time
pool.on('connect', client => {
  client
    .query(`SET TIME ZONE 'Asia/Dhaka';`)
    .catch(err => {
      console.error('Error setting session time zone to Asia/Dhaka:', err.message);
    });
});

module.exports = pool;
