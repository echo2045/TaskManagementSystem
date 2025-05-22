// backend/src/controllers/taskController.js
const pool = require('../db');

// GET /api/tasks — active (pending + not-yet-expired) tasks
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.full_name AS owner_name
        FROM tasks t
        JOIN users u ON t.owner_id = u.user_id
       WHERE t.status = 'pending'
         AND t.deadline >= NOW()
       ORDER BY t.deadline ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/archive — completed OR expired tasks
const getArchivedTasksForUser = async (req, res) => {
  const { id } = req.params;               // the user whose archive we’re fetching
  try {
    // 1) Fetch all tasks that are either completed OR deadline has passed
    const result = await pool.query(
      `SELECT
         t.task_id,
         t.title,
         t.description,
         t.deadline,
         t.importance,
         t.urgency,
         t.status,
         u.full_name    AS owner_name
       FROM tasks t
       JOIN users u ON t.owner_id = u.user_id
       WHERE t.owner_id = $1
         AND (
           t.status = 'completed'
           OR t.deadline  < NOW()
         )
       ORDER BY t.deadline ASC`,
      [id]
    );
    const rows = result.rows;

    // 2) For any _pending_ tasks whose deadline has now passed,
    //    fire a “deadline passed” notification once
    const now = new Date();
    for (const task of rows) {
      if (task.status !== 'completed' && new Date(task.deadline) < now) {
        const msg = `Your task “${task.title}” deadline has passed`;

        // Only insert if we haven't already for this exact message
        const exists = await pool.query(
          `SELECT 1
             FROM notifications
            WHERE user_id = $1
              AND message = $2`,
          [id, msg]
        );

        if (exists.rowCount === 0) {
          await pool.query(
            `INSERT INTO notifications (user_id, message)
             VALUES ($1, $2)`,
            [id, msg]
          );
        }
      }
    }

    // 3) Return the full archive payload
    res.json(rows);

  } catch (err) {
    console.error('[TASK ARCHIVE FETCH ERROR]', err);
    res.status(500).json({ error: 'Error fetching archived tasks' });
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

// PATCH /api/tasks/:id — update status (mark complete)
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *',
      [status, id]
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
      `SELECT u.user_id, u.full_name, u.email, ta.assigned_at
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
// POST /api/tasks/:id/assignees — assign delegate
const assignTask = async (req, res) => {
  const { id }      = req.params;
  const { user_id } = req.body;
  const assigned_by = req.user?.user_id || 1;  // your authenticated user

  try {
    // 1) Create assignment if it doesn't already exist
    await pool.query(
      `INSERT INTO task_assignments (task_id, assignee_id, assigned_by)
       SELECT $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1 FROM task_assignments
           WHERE task_id=$1 AND assignee_id=$2
        )`,
      [id, user_id, assigned_by]
    );

    // 2) Fetch the task's title
    const { rows: trows } = await pool.query(
      `SELECT title FROM tasks WHERE task_id = $1`,
      [id]
    );
    const taskTitle = trows[0]?.title || '(untitled)';

    // 3) Fetch the assigner's full_name
    const { rows: arows } = await pool.query(
      `SELECT full_name FROM users WHERE user_id = $1`,
      [assigned_by]
    );
    const assignerName = arows[0]?.full_name || 'Someone';

    // 4) Insert a notification
    await pool.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)`,
      [
        user_id,
        `${assignerName} assigned you "${taskTitle}"`
      ]
    );

    // 5) Return updated list
    const { rows: updated } = await pool.query(
      `SELECT u.user_id, u.full_name, u.email
         FROM task_assignments ta
         JOIN users u ON ta.assignee_id = u.user_id
        WHERE ta.task_id = $1`,
      [id]
    );
    res.json(updated);

  } catch (err) {
    console.error('Error assigning task:', err);
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
  getArchivedTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  getTaskAssignees,
  assignTask,
  unassignTask
};
