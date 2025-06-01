const pool = require('../db');

// POST /api/areas
const createArea = async (req, res) => {
  const { name, created_by } = req.body;
  try {
    const query = `INSERT INTO areas (name, created_by, is_completed) VALUES ($1, $2, false) RETURNING *`;
    const values =  [name, created_by];

    const result = await pool.query(
     query ,
     values
    );
    res.json({data:result.rows[0],messageCode:"SUCCESS"});
  } catch (err) {
    console.error('Error creating area:', err.message);
    res.status(500).json({ error: 'Could not create area' });
  }
};

// GET /api/areas
// Optionally filter by active/inactive: /api/areas?active=true
// GET /api/areas
// Optionally filter by active/inactive: /api/areas?active=true
// GET /api/areas
// Optionally filter by active/inactive: /api/areas?active=true
// GET /api/areas
// GET /api/areas
const getAllAreas = async (req, res) => {
  const { active } = req.query;
  try {
    let query = `
      SELECT 
        areas.*, 
        users.username AS creator_name
      FROM areas 
      LEFT JOIN users ON areas.created_by = users.user_id
    `;

    if (active === 'true') {
      query += ' WHERE areas.is_completed = false';
    } else if (active === 'false') {
      query += ' WHERE areas.is_completed = true';
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching areas:', err.message);
    res.status(500).json({ error: 'Could not fetch areas' });
  }
};




// PATCH /api/areas/:id/complete
const markAreaComplete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE areas SET is_completed = true WHERE area_id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking area complete:', err.message);
    res.status(500).json({ error: 'Could not complete area' });
  }
};

// DELETE /api/areas/:id
const deleteArea = async (req, res,next) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM areas WHERE area_id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting area:', err.message);
    res.status(500).json({ error: 'Could not delete area' });
  }
};

module.exports = {
  createArea,
  getAllAreas,
  markAreaComplete,
  deleteArea,
};
