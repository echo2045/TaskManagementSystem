// src/controllers/taskController.js
const pool = require('../db');

// GET /api/tasks
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
      SELECT
        ta.task_id, u.user_id, u.full_name,
        ta.importance AS assignee_importance,
        ta.urgency AS assignee_urgency,
        d.full_name AS delegated_by
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      LEFT JOIN users d ON ta.assigned_by = d.user_id
    `);

    const grouped = {};
    assignees.rows.forEach(row => {
      if (!grouped[row.task_id]) grouped[row.task_id] = [];
      grouped[row.task_id].push({
        user_id: row.user_id,
        full_name: row.full_name,
        delegated_by: row.delegated_by || null,
        importance: row.assignee_importance,
        urgency: row.assignee_urgency
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

// GET /api/tasks/archive/:id
const getArchivedTasksForUser = async (req, res) => {
  const { id } = req.params;

  try {
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

    const assigneeResult = await pool.query(`
      SELECT
        ta.task_id, u.user_id, u.full_name,
        ta.importance AS assignee_importance,
        ta.urgency AS assignee_urgency,
        d.full_name AS delegated_by
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      LEFT JOIN users d ON ta.assigned_by = d.user_id
    `);

    const assigneesByTask = {};
    assigneeResult.rows.forEach(row => {
      if (!assigneesByTask[row.task_id]) {
        assigneesByTask[row.task_id] = [];
      }
      assigneesByTask[row.task_id].push({
        user_id: row.user_id,
        full_name: row.full_name,
        delegated_by: row.delegated_by || null,
        importance: row.assignee_importance,
        urgency: row.assignee_urgency
      });
    });

    const filtered = allArchivedTasks.filter(task => {
      const isOwner = task.owner_id === Number(id);
      const isAssigned = (assigneesByTask[task.task_id] || []).some(a => a.user_id === Number(id));
      return isOwner || isAssigned;
    });

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

// POST /api/tasks
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

// PATCH /api/tasks/:id
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

// DELETE /api/tasks/:id
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

// ✅ FIXED: GET /api/tasks/:id/assignees
const getTaskAssignees = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        u.user_id, u.full_name, u.email,
        ta.importance AS assignee_importance,
        ta.urgency AS assignee_urgency,
        d.full_name AS delegated_by
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      LEFT JOIN users d ON ta.assigned_by = d.user_id
      WHERE ta.task_id = $1
    `, [id]);

    // ✅ Map fields to match frontend expectations
    const formatted = result.rows.map(row => ({
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      importance: row.assignee_importance,
      urgency: row.assignee_urgency,
      delegated_by: row.delegated_by
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching assignees:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks/:id/assignees
const assignTask = async (req, res) => {
  const { id } = req.params;
  const { user_id, importance, urgency } = req.body;
  const assigned_by = req.user?.user_id || 1;

  try {
    const alreadyAssigned = await pool.query(`
      SELECT 1 FROM task_assignments
      WHERE task_id = $1 AND assignee_id = $2
    `, [id, user_id]);

    if (alreadyAssigned.rows.length > 0) {
      return res.status(400).json({ error: 'User is already assigned to this task.' });
    }

    await pool.query(`
      INSERT INTO task_assignments (task_id, assignee_id, assigned_by, importance, urgency)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, user_id, assigned_by, importance, urgency]);

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

// DELETE /api/tasks/:id/assignees/:userId
const unassignTask = async (req, res) => {
  const { id, userId } = req.params;
  const requestorId = req.user?.user_id || 1;

  try {
    const result = await pool.query(`
      DELETE FROM task_assignments
      WHERE task_id = $1 AND assignee_id = $2 AND assigned_by = $3
    `, [id, userId, requestorId]);

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'You can only unassign users you personally assigned.' });
    }

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
