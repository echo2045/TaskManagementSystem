module.exports = (io) => {
  const pool = require('../db');

  return {
    getNotificationsForUser: async (req, res) => {
      const userId = parseInt(req.params.id, 10);
      try {
        // B) Fetch ALL your notifications, including is_read
        const { rows } = await pool.query(
          `SELECT notification_id, message, created_at, is_read
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
    },

    markNotificationsRead: async (req, res) => {
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
    },

    deleteNotification: async (req, res) => {
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
    },
  };
};
