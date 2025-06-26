const pool = require('../db');

// POST /api/projects
const createProject = async (req, res) => {
  const { name, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, created_by, is_completed)
       VALUES ($1, $2, false) RETURNING *`,
      [name, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// GET /api/projects
const getAllProjects = async (req, res) => {
  const { active } = req.query;
  let query = `
    SELECT p.*, u.full_name AS creator_name
    FROM projects p
    JOIN users u ON p.created_by = u.user_id
  `;

  if (active === 'true') query += ` WHERE p.is_completed = false`;
  else if (active === 'false') query += ` WHERE p.is_completed = true`;

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// PATCH /api/projects/:project_id/complete
const markProjectComplete = async (req, res) => {
  const { project_id } = req.params;
  const { is_completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE projects SET is_completed = $1 WHERE project_id = $2 RETURNING *`,
      [is_completed, project_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating project status:', err.message);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};

// DELETE /api/projects/:project_id
const deleteProject = async (req, res) => {
  const { project_id } = req.params;

  try {
    // Tasks referencing this project will be auto-deleted or nullified depending on your schema
    await pool.query(`DELETE FROM projects WHERE project_id = $1`, [project_id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// PATCH /api/projects/:project_id
const updateProject = async (req, res) => {
  const { project_id } = req.params;
  const { name } = req.body;

  try {
    const result = await pool.query(
      `UPDATE projects SET name = $1 WHERE project_id = $2 RETURNING *`,
      [name, project_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error renaming project:', err.message);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  markProjectComplete,
  deleteProject,
  updateProject
};
