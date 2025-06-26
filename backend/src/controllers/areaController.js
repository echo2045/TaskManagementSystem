const pool = require('../db');

// POST /api/areas
const createArea = async (req, res) => {
  const { name, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO areas (name, created_by, is_completed)
       VALUES ($1, $2, false) RETURNING *`,
      [name, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating area:', err.message);
    res.status(500).json({ error: 'Failed to create area' });
  }
};

// GET /api/areas
const getAllAreas = async (req, res) => {
  const { active } = req.query;
  let query = `
    SELECT a.*, u.full_name AS creator_name
    FROM areas a
    JOIN users u ON a.created_by = u.user_id
  `;

  if (active === 'true') query += ` WHERE a.is_completed = false`;
  else if (active === 'false') query += ` WHERE a.is_completed = true`;

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching areas:', err.message);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
};

// PATCH /api/areas/:area_id/complete
const markAreaComplete = async (req, res) => {
  const { area_id } = req.params;
  const { is_completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE areas SET is_completed = $1 WHERE area_id = $2 RETURNING *`,
      [is_completed, area_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating area status:', err.message);
    res.status(500).json({ error: 'Failed to update area status' });
  }
};

// DELETE /api/areas/:area_id
const deleteArea = async (req, res) => {
  const { area_id } = req.params;

  try {
    await pool.query(`DELETE FROM areas WHERE area_id = $1`, [area_id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting area:', err.message);
    res.status(500).json({ error: 'Failed to delete area' });
  }
};

// PATCH /api/areas/:area_id
const updateArea = async (req, res) => {
  const { area_id } = req.params;
  const { name } = req.body;

  try {
    const result = await pool.query(
      `UPDATE areas SET name = $1 WHERE area_id = $2 RETURNING *`,
      [name, area_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error renaming area:', err.message);
    res.status(500).json({ error: 'Failed to update area' });
  }
};

module.exports = {
  createArea,
  getAllAreas,
  markAreaComplete,
  deleteArea,
  updateArea
};
