// backend/src/controllers/authController.js
const pool   = require('../db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// POST /api/auth/register
async function register(req, res) {
  const { username, full_name, email, password, role } = req.body;
  console.log('[AUTH] register payload:', req.body);
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (username, full_name, email, password, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING user_id, username, full_name, email, role`,
      [username, full_name, email, hash, role]
    );
    console.log('[AUTH] registered user:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[AUTH] register error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { identifier, password } = req.body;
  console.log('[AUTH] login attempt:', { identifier, password: password ? '***' : undefined });
  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier and password required' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT user_id, username, full_name, email, password, role
         FROM users
        WHERE username = $1 OR email = $1`,
      [identifier]
    );
    console.log('[AUTH] query result rows:', rows);
    if (rows.length === 0) {
      console.log('[AUTH] no matching user');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    console.log('[AUTH] password match:', match);
    if (!match) {
      console.log('[AUTH] password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );
    console.log('[AUTH] login success, issuing token for user_id:', user.user_id);
    res.json({
      token,
      user: {
        user_id:   user.user_id,
        username:  user.username,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role
      }
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login };
