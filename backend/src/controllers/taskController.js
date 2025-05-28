const pool = require('../db');

// GET /api/tasks — fetch active (non-archived) tasks
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.task_id, t.title, t.description, t.deadline,
        t.importance, t.urgency, t.status, t.owner_id,
        t.project_id, p.name AS project_name,
        t.area_id, a.name AS area_name,
        u.full_name AS owner_name
      FROM tasks t
      JOIN users u ON t.owner_id = u.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      LEFT JOIN areas a ON t.area_id = a.area_id
      WHERE t.status = 'pending' AND t.deadline >= NOW()
      ORDER BY t.deadline ASC
    `);

    const tasks = result.rows;

    const assignees = await pool.query(`
      SELECT ta.task_id, u.user_id, u.full_name
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
    `);

    const grouped = {};
    assignees.rows.forEach(row => {
      if (!grouped[row.task_id]) grouped[row.task_id] = [];
      grouped[row.task_id].push({
        user_id: row.user_id,
        full_name: row.full_name
      });
    });

    const enriched = tasks.map(t => ({
      ...t,
      assignees: grouped[t.task_id] || []
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/archive/:id — completed OR expired tasks for a user
const getArchivedTasksForUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch all completed or expired tasks
    const taskResult = await pool.query(`
      SELECT
        t.task_id, t.title, t.description, t.deadline, t.importance, t.urgency,
        t.status, t.project_id, t.area_id,
        u.full_name AS owner_name, t.owner_id
      FROM tasks t
      JOIN users u ON t.owner_id = u.user_id
      WHERE (t.status = 'completed' OR t.deadline < NOW())
      ORDER BY t.deadline ASC
    `);

    const allArchivedTasks = taskResult.rows;

    // Fetch all assignees in one go
    const assigneeResult = await pool.query(`
      SELECT ta.task_id, u.user_id, u.full_name
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
    `);

    // Group assignees by task_id
    const assigneesByTask = {};
    assigneeResult.rows.forEach(row => {
      if (!assigneesByTask[row.task_id]) {
        assigneesByTask[row.task_id] = [];
      }
      assigneesByTask[row.task_id].push({
        user_id: row.user_id,
        full_name: row.full_name
      });
    });

    // Filter to tasks the user owns or is assigned to
    const filtered = allArchivedTasks.filter(task => {
      const isOwner = task.owner_id === Number(id);
      const isAssigned = (assigneesByTask[task.task_id] || []).some(a => a.user_id === Number(id));
      return isOwner || isAssigned;
    });

    // Attach assignees
    const enriched = filtered.map(t => ({
      ...t,
      assignees: assigneesByTask[t.task_id] || []
    }));

    res.json(enriched);
  } catch (err) {
    console.error('[TASK ARCHIVE FETCH ERROR]', err);
    res.status(500).json({ error: 'Error fetching archived tasks' });
  }
};


// POST /api/tasks — create task
const createTask = async (req, res) => {
  const {
    title, description, deadline, importance, urgency,
    owner_id, project_id = null, area_id = null
  } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO tasks (title, description, deadline, importance, urgency, owner_id, status, project_id, area_id)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING *
    `, [title, description, deadline, importance, urgency, owner_id, project_id, area_id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id — update task status
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(`
      UPDATE tasks SET status = $1 WHERE task_id = $2
      RETURNING *
    `, [status, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id — delete a task
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

// GET /api/tasks/:id/assignees — get assignees
const getTaskAssignees = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, ta.assigned_at
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      WHERE ta.task_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assignees:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks/:id/assignees — assign task
const assignTask = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  const assigned_by = req.user?.user_id || 1;

  try {
    await pool.query(`
      INSERT INTO task_assignments (task_id, assignee_id, assigned_by)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (
        SELECT 1 FROM task_assignments
        WHERE task_id = $1 AND assignee_id = $2
      )
    `, [id, user_id, assigned_by]);

    const { rows: taskInfo } = await pool.query(
      'SELECT title FROM tasks WHERE task_id = $1',
      [id]
    );
    const taskTitle = taskInfo[0]?.title || '(untitled)';

    const { rows: assignerInfo } = await pool.query(
      'SELECT full_name FROM users WHERE user_id = $1',
      [assigned_by]
    );
    const assignerName = assignerInfo[0]?.full_name || 'Someone';

    await pool.query(`
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
    `, [user_id, `${assignerName} assigned you "${taskTitle}"`]);

    const { rows: updated } = await pool.query(`
      SELECT u.user_id, u.full_name, u.email
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      WHERE ta.task_id = $1
    `, [id]);

    res.json(updated);
  } catch (err) {
    console.error('Error assigning task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id/assignees/:userId — unassign
const unassignTask = async (req, res) => {
  const { id, userId } = req.params;

  try {
    await pool.query(`
      DELETE FROM task_assignments
      WHERE task_id = $1 AND assignee_id = $2
    `, [id, userId]);

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
