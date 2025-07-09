// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
const pool = require('../db'); // Import the database pool

async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Fetch full_name from the database
    const userResult = await pool.query('SELECT full_name FROM users WHERE user_id = $1', [payload.user_id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = { ...payload, full_name: userResult.rows[0].full_name };  // Add full_name to payload
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
