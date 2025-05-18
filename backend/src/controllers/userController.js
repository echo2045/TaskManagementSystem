// backend/src/controllers/userController.js
const pool = require('../db');           // ← was './db', needs to point up one level

// GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
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
};

// POST /api/users
const createUser = async (req, res) => {
  const { username, full_name, email, password, role } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, full_name, email, password, role)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [username, full_name, email, password, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/users/:id
const updateUser = async (req, res) => {
  const { id } = req.params;
  const fields = [], values = [];
  Object.entries(req.body).forEach(([k,v], i) => {
    fields.push(`${k} = $${i+1}`);
    values.push(v);
  });
  if (!fields.length) return res.sendStatus(400);
  values.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Dynamic Role Assignment ── */

// GET /api/users/:id/supervisees
const getSupervisees = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.role
       FROM user_supervisors us
       JOIN users u ON us.supervisee_id = u.user_id
       WHERE us.supervisor_id = $1
       ORDER BY u.full_name`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users/:id/supervisees
const assignSupervisee = async (req, res) => {
  const { id } = req.params;
  const { supervisee_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_supervisors (supervisor_id, supervisee_id)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [id, supervisee_id]
    );
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id/supervisees/:superviseeId
const unassignSupervisee = async (req, res) => {
  const { id, superviseeId } = req.params;
  try {
    await pool.query(
      `DELETE FROM user_supervisors
       WHERE supervisor_id = $1 AND supervisee_id = $2`,
      [id, superviseeId]
    );
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSupervisees,
  assignSupervisee,
  unassignSupervisee
};
