// backend/src/controllers/userController.js
const pool   = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// GET /api/users
async function getAllUsers(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/users/:id
async function getUserById(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [id]
    );
    if (!rows.length) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/users
// now hashes the incoming password
async function createUser(req, res) {
  const { username, full_name, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (username, full_name, email, password, role)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [username, full_name, email, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/users/:id
// general update (excludes password)
// PATCH /api/users/:id
async function updateUser(req, res) {
  const { id } = req.params;
  const fields = [], values = [];

  // Log request for debugging
  console.log('Received update for user ID:', id);
  console.log('Request body:', req.body);

  Object.entries(req.body).forEach(([k, v], i) => {
    if (k === 'password' || k === 'user_id') return; // Skip password & ID
    if (v !== undefined && v !== null) {
      fields.push(`${k} = $${fields.length + 1}`);
      values.push(v);
    }
  });

  if (!fields.length) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  values.push(id);

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  const { id } = req.params;
  const isManagerOrHR = req.user.role === 'manager' || req.user.role === 'hr';

  if (!isManagerOrHR) {
    return res.status(403).json({ error: 'Forbidden: Only Managers or HR can delete users' });
  }

  try {
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ── Supervisors ── */
async function getSupervisees(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, u.role
        FROM user_supervisors us
        JOIN users u ON us.supervisee_id = u.user_id
       WHERE us.supervisor_id = $1
       ORDER BY u.full_name
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function assignSupervisee(req, res) {
  const { id } = req.params;
  const { supervisee_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_supervisors (supervisor_id, supervisee_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [id, supervisee_id]
    );
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function unassignSupervisee(req, res) {
  const { id, superviseeId } = req.params;
  try {
    await pool.query(
      `DELETE FROM user_supervisors
         WHERE supervisor_id=$1 AND supervisee_id=$2`,
      [id, superviseeId]
    );
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ── Change Password ── */
// now hashes the new password before saving
async function changePassword(req, res) {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT password FROM users WHERE user_id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (!await bcrypt.compare(oldPassword, rows[0].password)) {
      return res.status(400).json({ error: 'Old password incorrect' });
    }
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hash, id]
    );
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUserTasks(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT DISTINCT t.*, u.full_name AS owner_name
        FROM tasks t
        JOIN users u ON t.owner_id = u.user_id
   LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
       WHERE t.status = 'pending'
         AND t.deadline >= NOW()
         AND (t.owner_id = $1 OR ta.assignee_id = $1)
    ORDER BY t.deadline ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({ error: err.message });
  }
}

// ── New: GET /api/users/:id/tasks/archive ──
async function getUserArchivedTasks(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT DISTINCT t.*, u.full_name AS owner_name
        FROM tasks t
        JOIN users u ON t.owner_id = u.user_id
   LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
       WHERE (t.status != 'pending' OR t.deadline < NOW())
         AND (t.owner_id = $1 OR ta.assignee_id = $1)
    ORDER BY t.deadline ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user archived tasks:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getCurrentTask(req, res) {
  const { id } = req.params;

  try {
      const result = await pool.query(
          `SELECT
              t.task_id,
              t.title,
              t.time_estimate,
              ws.start_time,
              t.deadline
           FROM work_sessions ws
           JOIN tasks t ON ws.task_id = t.task_id
           WHERE ws.user_id = $1 AND ws.end_time IS NULL`,
          [id]
      );

      if (result.rows.length > 0) {
          const currentTask = result.rows[0];
          // If deadline passed, still return the task, but it's considered overdue
          res.json(currentTask);
      } else {
          res.json(null); // No active task
      }
  } catch (err) {
      console.error('Error fetching current task:', err.message);
      res.status(500).json({ error: 'Failed to fetch current task.' });
  }
}

async function getWorkHistory(req, res) {
  const { userId } = req.params;

  try {
      const result = await pool.query(
          `SELECT
             ws.session_id,
             ws.user_id,
             ws.start_time,
             ws.end_time,
             t.task_id,
             t.title,
             t.time_estimate,
             EXTRACT(EPOCH FROM (COALESCE(ws.end_time, CURRENT_TIMESTAMP) - ws.start_time))/3600 AS hours_spent
           FROM work_sessions ws
           JOIN tasks t ON ws.task_id = t.task_id
           WHERE ws.user_id = $1
           ORDER BY ws.start_time DESC`,
          [userId]
      );

      res.json(result.rows);
  } catch (err) {
      console.error('Error fetching work history:', err.message);
      res.status(500).json({ error: 'Failed to fetch work history.' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSupervisees,
  assignSupervisee,
  unassignSupervisee,
  changePassword,
  getUserTasks,
  getUserArchivedTasks,
  getCurrentTask,
  getWorkHistory
};
