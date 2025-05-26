const pool = require('../db');

const createArea = async (req, res) => {
  const { name, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO areas (name, created_by)
       VALUES ($1, $2)
       RETURNING *`,
      [name, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating area:', err.message);
    res.status(500).json({ error: 'Failed to create area' });
  }
};

const getAllAreas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM areas ORDER BY area_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching areas:', err.message);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
};

module.exports = { createArea, getAllAreas };
