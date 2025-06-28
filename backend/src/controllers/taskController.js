const pool = require('../db');

// GET /api/tasks
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.task_id, t.title, t.description, t.deadline,
        t.importance, t.urgency, t.status, t.owner_id,
        t.start_date, t.created_at,
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
        ta.is_completed,
        ta.start_date,
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
        urgency: row.assignee_urgency,
        is_completed: row.is_completed,
        start_date: row.start_date
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

// GET /api/tasks/archive/:user_id
const getArchivedTasksForUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const taskResult = await pool.query(`
      SELECT
        t.task_id, t.title, t.description, t.deadline,
        t.importance, t.urgency, t.status, t.owner_id,
        t.start_date, t.created_at,
        t.project_id, t.area_id,
        u.full_name AS owner_name
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
        ta.is_completed,
        ta.start_date,
        d.full_name AS delegated_by
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      LEFT JOIN users d ON ta.assigned_by = d.user_id
    `);

    const assigneesByTask = {};
    assigneeResult.rows.forEach(row => {
      if (!assigneesByTask[row.task_id]) assigneesByTask[row.task_id] = [];
      assigneesByTask[row.task_id].push({
        user_id: row.user_id,
        full_name: row.full_name,
        delegated_by: row.delegated_by || null,
        importance: row.assignee_importance,
        urgency: row.assignee_urgency,
        is_completed: row.is_completed,
        start_date: row.start_date
      });
    });

    const filtered = allArchivedTasks.filter(task => {
      const isOwner = task.owner_id === Number(user_id);
      const isAssigned = (assigneesByTask[task.task_id] || []).some(a => a.user_id === Number(user_id));
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
    owner_id, project_id = null, area_id = null, start_date = null
  } = req.body;

  try {
    const normalizedDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;

    const result = await pool.query(`
      INSERT INTO tasks (title, description, deadline, importance, urgency, owner_id, status, project_id, area_id, start_date)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
      RETURNING *
    `, [title, description, deadline, importance, urgency, owner_id, project_id, area_id, normalizedDate]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id
const updateTask = async (req, res) => {
  const { task_id } = req.params;
  const {
    title, description, deadline, importance, urgency,
    status, project_id = null, area_id = null, start_date
  } = req.body;

  try {
    const existingTask = await pool.query(
      'SELECT deadline FROM tasks WHERE task_id = $1',
      [task_id]
    );

    if (existingTask.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const finalDeadline = deadline || existingTask.rows[0].deadline;
    if (start_date && new Date(start_date) > new Date(finalDeadline)) {
      return res.status(400).json({ error: 'Start date cannot be after the deadline.' });
    }

    const normalizedStart = start_date ? new Date(start_date).toISOString().split('T')[0] : null;

    const result = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        deadline = COALESCE($3, deadline),
        importance = COALESCE($4, importance),
        urgency = COALESCE($5, urgency),
        status = COALESCE($6, status),
        project_id = $7,
        area_id = $8,
        start_date = COALESCE($9, start_date)
      WHERE task_id = $10
      RETURNING *
    `, [
      title, description, deadline, importance, urgency,
      status, project_id, area_id, normalizedStart, task_id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/tasks/:task_id
const updateTaskDetails = async (req, res) => {
  const { task_id } = req.params;
  const updates = req.body;

  try {
    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, val], idx) => {
      fields.push(`${key} = $${idx + 1}`);
      values.push(val);
    });

    const query = `
      UPDATE tasks SET ${fields.join(', ')} WHERE task_id = $${values.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, task_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task details:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id/assignees
const getTaskAssignees = async (req, res) => {
  const { task_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        u.user_id, u.full_name, u.email,
        ta.importance AS assignee_importance,
        ta.urgency,
        ta.is_completed,
        ta.start_date,
        d.full_name AS delegated_by
      FROM task_assignments ta
      JOIN users u ON ta.assignee_id = u.user_id
      LEFT JOIN users d ON ta.assigned_by = d.user_id
      WHERE ta.task_id = $1
    `, [task_id]);

    const formatted = result.rows.map(row => ({
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      importance: row.assignee_importance,
      urgency: row.urgency,
      is_completed: row.is_completed,
      delegated_by: row.delegated_by,
      start_date: row.start_date
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching assignees:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tasks/:id/assignees
const assignTask = async (req, res) => {
  const { task_id } = req.params;
  const { user_id, importance, urgency, start_date } = req.body;
  const assigned_by = req.user?.user_id || 1;

  try {
    const alreadyAssigned = await pool.query(`
      SELECT 1 FROM task_assignments
      WHERE task_id = $1 AND assignee_id = $2
    `, [task_id, user_id]);

    if (alreadyAssigned.rows.length > 0) {
      return res.status(400).json({ error: 'User is already assigned to this task.' });
    }

    const normalizedStart = start_date ? new Date(start_date).toISOString().split('T')[0] : null;

    await pool.query(`
      INSERT INTO task_assignments (task_id, assignee_id, assigned_by, importance, urgency, start_date)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [task_id, user_id, assigned_by, importance, urgency, normalizedStart]);

    res.status(201).json({ message: 'Task assigned successfully.' });
  } catch (err) {
    console.error('Error assigning task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id/assignees/:userId
const unassignTask = async (req, res) => {
  const { task_id, userId } = req.params;
  const requestorId = req.user?.user_id || 1;

  try {
    const result = await pool.query(`
      DELETE FROM task_assignments
      WHERE task_id = $1 AND assignee_id = $2 AND assigned_by = $3
    `, [task_id, userId, requestorId]);

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'You can only unassign users you personally assigned.' });
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Error unassigning task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:taskId/assignment/:userId/complete
const markAssignmentCompleted = async (req, res) => {
  const { task_id, userId } = req.params;
  const { is_completed } = req.body;

  try {
    await pool.query(`
      UPDATE task_assignments
      SET is_completed = $1
      WHERE task_id = $2 AND assignee_id = $3
    `, [is_completed, task_id, userId]);

    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating assignment completion", err);
    res.status(500).json({ error: "Failed to update completion status" });
  }
};

// PATCH /api/tasks/:taskId/assignment/:userId/start-date
const updateAssignmentStartDate = async (req, res) => {
  const { task_id, userId } = req.params;
  const { start_date } = req.body;
  const requestorId = req.user?.user_id || 1;

  try {
    const check = await pool.query(`
      SELECT ta.assigned_by, t.deadline
      FROM task_assignments ta
      JOIN tasks t ON t.task_id = ta.task_id
      WHERE ta.task_id = $1 AND ta.assignee_id = $2
    `, [task_id, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const { assigned_by, deadline } = check.rows[0];

    if (assigned_by !== requestorId) {
      return res.status(403).json({ error: 'Only the assigner can update the start date.' });
    }

    if (new Date(start_date) > new Date(deadline)) {
      return res.status(400).json({ error: 'Start date cannot be after the task deadline.' });
    }

    const normalizedStart = new Date(start_date).toISOString().split('T')[0];

    await pool.query(`
      UPDATE task_assignments
      SET start_date = $1
      WHERE task_id = $2 AND assignee_id = $3
    `, [normalizedStart, task_id, userId]);

    res.status(200).json({ message: 'Start date updated successfully.' });
  } catch (err) {
    console.error('Error updating start date:', err.message);
    res.status(500).json({ error: 'Failed to update start date' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const { task_id } = req.params;

  try {
    await pool.query('DELETE FROM tasks WHERE task_id = $1', [task_id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTasks,
  getArchivedTasksForUser,
  createTask,
  updateTask,
  updateTaskDetails,
  deleteTask,
  getTaskAssignees,
  assignTask,
  unassignTask,
  markAssignmentCompleted,
  updateAssignmentStartDate
};
