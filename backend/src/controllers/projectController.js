const pool = require('../db');

const createProject = async (req, res) => {
  const { name, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, created_by)
       VALUES ($1, $2)
       RETURNING *`,
      [name, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM projects ORDER BY project_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

module.exports = { createProject, getAllProjects };
