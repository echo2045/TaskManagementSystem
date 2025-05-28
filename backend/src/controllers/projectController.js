// backend/src/controllers/projectController.js
const pool = require('../db');

// Create a project
const createProject = async (req, res) => {
  const { name, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get all projects (optionally filter by active)
const getAllProjects = async (req, res) => {
  const { active } = req.query;
  try {
    let baseQuery = `
      SELECT
        p.project_id,
        p.name,
        p.is_completed,
        p.created_by,
        u.full_name AS created_by_name
      FROM projects p
      JOIN users u ON p.created_by = u.user_id
    `;

    if (active === 'true') {
      baseQuery += ' WHERE p.is_completed = false';
    } else if (active === 'false') {
      baseQuery += ' WHERE p.is_completed = true';
    }

    baseQuery += ' ORDER BY p.project_id DESC';

    const result = await pool.query(baseQuery);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Mark project as complete
const markProjectComplete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE projects SET is_completed = true WHERE project_id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error completing project:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Delete a project (cascade deletes tasks)
const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE project_id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  markProjectComplete,
  deleteProject
};
