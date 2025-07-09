const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/auth');

module.exports = (io) => {

  // GET /api/requests/supervisors
  router.get('/supervisors', authenticate, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT u.user_id, u.full_name
        FROM users u
        JOIN user_supervisors us ON u.user_id = us.supervisor_id
        WHERE us.supervisee_id = $1
      `, [req.user.user_id]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching supervisors:', err.message);
      res.status(500).json({ error: 'Failed to fetch supervisors' });
    }
  });

  // POST /api/requests
  router.post('/', authenticate, async (req, res) => {
    const { supervisor_id, title } = req.body;
    const requester_id = req.user.user_id;

    try {
      const result = await pool.query(`
        INSERT INTO task_requests (requester_id, supervisor_id, title)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [requester_id, supervisor_id, title]);

      const request = result.rows[0];

      // Create a notification for the supervisor
      const message = `${req.user.full_name} requested a new task: "${title}"`;
      const notificationResult = await pool.query(`
        INSERT INTO notifications (user_id, message, type, metadata)
        VALUES ($1, $2, 'task_request', $3)
        RETURNING notification_id, user_id, message, created_at, is_read, type, metadata
      `, [supervisor_id, message, JSON.stringify({ request_id: request.request_id, title: title, requester_id: requester_id })]);

      const newNotification = notificationResult.rows[0];

      // Notify the 'new_notification_channel' with the full payload
      io.to(newNotification.user_id.toString()).emit('new_notification', newNotification);

      res.status(201).json(request);
    } catch (err) {
      console.error('Error creating task request:', err.message);
      res.status(500).json({ error: 'Failed to create task request' });
    }
  });

  // PATCH /api/requests/:request_id
  router.patch('/:request_id', authenticate, async (req, res) => {
    const { request_id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id;

    try {
      const result = await pool.query(`
        UPDATE task_requests
        SET status = $1
        WHERE request_id = $2 AND supervisor_id = $3
        RETURNING *
      `, [status, request_id, user_id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Task request not found or you are not authorized to update it' });
      }

      const updatedRequest = result.rows[0];

      // Update the corresponding notification for the supervisor
      const notificationMessage = `Task request "${updatedRequest.title}" has been ${status}.`;
      const notificationMetadata = { ...JSON.parse(updatedRequest.metadata || '{}'), status: status };

      await pool.query(
        `UPDATE notifications
         SET message = $1, metadata = $2
         WHERE metadata->>'request_id' = $3::text
         RETURNING *`,
        [notificationMessage, JSON.stringify(notificationMetadata), request_id]
      );

      // If the request is denied, send a notification to the requester
      if (status === 'denied') {
        const requesterNotificationMessage = `Your request for "${updatedRequest.title}" was denied by ${req.user.full_name}.`;
        const requesterNotificationResult = await pool.query(
          'INSERT INTO notifications (user_id, message, type, metadata) VALUES ($1, $2, $3, $4) RETURNING *'
          , [updatedRequest.requester_id, requesterNotificationMessage, 'request_denied', JSON.stringify({ request_id: updatedRequest.request_id, title: updatedRequest.title, denied_by: req.user.full_name })]
        );
        const newRequesterNotification = requesterNotificationResult.rows[0];
        io.to(newRequesterNotification.user_id.toString()).emit('new_notification', newRequesterNotification);
      }

      res.json(updatedRequest);
    } catch (err) {
      console.error('Error updating task request:', err.message);
      res.status(500).json({ error: 'Failed to update task request' });
    }
  });

  return router;
};