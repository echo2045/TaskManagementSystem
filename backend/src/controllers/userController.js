// backend/src/controllers/userController.js
const pool = require('../db');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new user
const createUser = async (req, res) => {
  const { username, full_name, email, password, role } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, full_name, email, password, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
};
