// backend/src/controllers/taskController.js
const pool = require('../db');

// GET /api/tasks — active tasks
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.full_name AS owner_name
      FROM tasks t
      JOIN users u ON t.owner_id = u.user_id
      WHERE t.status = 'pending'
      ORDER BY t.deadline ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/archive — archived tasks
const getArchivedTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.full_name AS owner_name
      FROM tasks t
      JOIN users u ON t.owner_id = u.user_id
      WHERE t.status != 'pending'
      ORDER BY t.deadline ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching archived tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks — create new task
const createTask = async (req, res) => {
  const { title, description, deadline, importance, urgency, owner_id } = req.body;
  const status = 'pending';
  try {
    const result = await pool.query(
      `INSERT INTO tasks
         (title, description, deadline, importance, urgency, owner_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [title, description, deadline, importance, urgency, owner_id, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id — update status or other fields
const updateTask = async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  Object.entries(req.body).forEach(([key, val], idx) => {
    fields.push(`${key} = $${idx + 1}`);
    values.push(val);
  });
  if (!fields.length) return res.sendStatus(400);
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE task_id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id — delete task
const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE task_id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id/assignees — list delegates
const getTaskAssignees = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, ta.assigned_at, ta.is_completed
       FROM task_assignments ta
       JOIN users u ON ta.assignee_id = u.user_id
       WHERE ta.task_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assignees:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks/:id/assignees — assign delegate
const assignTask = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  const assigned_by = 1; // TODO: pull from auth
  try {
    await pool.query(
      `INSERT INTO task_assignments (task_id, assignee_id, assigned_by)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM task_assignments
         WHERE task_id=$1 AND assignee_id=$2
       )`,
      [id, user_id, assigned_by]
    );
    // return updated list
    const updated = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, ta.assigned_at, ta.is_completed
       FROM task_assignments ta
       JOIN users u ON ta.assignee_id = u.user_id
       WHERE ta.task_id = $1`,
      [id]
    );
    res.json(updated.rows);
  } catch (err) {
    console.error('Error assigning task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id/assignees/:userId — unassign delegate
const unassignTask = async (req, res) => {
  const { id, userId } = req.params;
  try {
    await pool.query(
      'DELETE FROM task_assignments WHERE task_id=$1 AND assignee_id=$2',
      [id, userId]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('Error unassigning task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTasks,
  getArchivedTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskAssignees,
  assignTask,
  unassignTask
};
