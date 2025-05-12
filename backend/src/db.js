// Load environment variables from .env
require('dotenv').config();

const { Pool } = require('pg');

// Create a new connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,           // e.g. 'postgres'
  password: process.env.DB_PASSWORD,   // e.g. '1234'
  host: process.env.DB_HOST,           // e.g. 'localhost'
  port: process.env.DB_PORT,           // e.g. 5432
  database: process.env.DB_NAME        // e.g. 'TaskManagementSystem'
});

// Optional: Test connection immediately
pool.connect()
  .then(client => {
    console.log('🟢 Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.error('🔴 Database connection error:', err.stack);
  });

module.exports = pool;
