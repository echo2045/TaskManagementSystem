// backend/src/controllers/taskController.js
const pool = require('../db');

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new task
const createTask = async (req, res) => {
  const { title, description, deadline, importance, urgency, owner_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, deadline, importance, urgency, owner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, deadline, importance, urgency, owner_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark task as complete (by owner)
const markTaskAsComplete = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *',
      ['completed', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task marked as completed', task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get archived tasks
const getArchivedTasks = async (req, res) => {
  try {
    const now = new Date();

    const result = await pool.query(`
      SELECT *,
        CASE
          WHEN status = 'completed' THEN 'complete'
          ELSE 'incomplete'
        END AS archive_status
      FROM tasks
      WHERE status = 'completed' OR deadline < $1
      ORDER BY deadline DESC;
    `, [now]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  getAllTasks,
  createTask,
  markTaskAsComplete,
  getArchivedTasks,
};
