// backend/src/controllers/notificationsController.js
const pool = require('../db');

// GET /api/notifications/user/:id
exports.getNotificationsForUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    // A) Insert deadline-passed alerts for owned + delegated tasks
    const owned = await pool.query(
      `SELECT task_id, title
         FROM tasks
        WHERE owner_id = $1
          AND status = 'pending'
          AND deadline < NOW()`,
      [userId]
    );
    const delegated = await pool.query(
      `SELECT t.task_id, t.title
         FROM tasks t
         JOIN task_assignments ta ON ta.task_id = t.task_id
        WHERE ta.assignee_id  = $1
          AND ta.is_completed = false
          AND t.deadline      < NOW()`,
      [userId]
    );
    for (const { title } of [...owned.rows, ...delegated.rows]) {
      const msg = `Your task “${title}” deadline has passed`;
      const exists = await pool.query(
        `SELECT 1 FROM notifications WHERE user_id=$1 AND message=$2`,
        [userId, msg]
      );
      if (exists.rowCount === 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, message) VALUES($1,$2)`,
          [userId, msg]
        );
      }
    }

    // B) Fetch ALL your notifications, including is_read
    const { rows } = await pool.query(
      `SELECT notification_id, message, created_at, is_read, type, metadata
             FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [userId]
    );
    return res.json(rows);

  } catch (err) {
    console.error('[NOTIFICATIONS FETCH ERROR]', err);
    return res.status(500).json({ error: 'Could not fetch notifications' });
  }
};

// PATCH /api/notifications/user/:id/mark-read
exports.markNotificationsRead = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    await pool.query(
      `UPDATE notifications
          SET is_read = TRUE
        WHERE user_id = $1
          AND is_read = FALSE`,
      [userId]
    );
    return res.sendStatus(204);
  } catch (err) {
    console.error('[NOTIFICATIONS MARK-READ ERROR]', err);
    return res.status(500).json({ error: 'Could not mark notifications read' });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await pool.query(
      'DELETE FROM notifications WHERE notification_id = $1',
      [id]
    );
    return res.sendStatus(204);
  } catch (err) {
    console.error('[NOTIFICATIONS DELETE ERROR]', err);
    return res.status(500).json({ error: 'Could not delete notification' });
  }
};
