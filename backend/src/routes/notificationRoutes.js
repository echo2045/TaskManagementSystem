// backend/src/routes/notificationRoutes.js
module.exports = (io) => {
  const express = require('express');
  const router = express.Router();
  const ctrl = require('../controllers/notificationController')(io);

  // fetch for user
  router.get('/user/:id', ctrl.getNotificationsForUser);

  // mark all read for user
  router.patch('/user/:id/mark-read', ctrl.markNotificationsRead);

  // delete one
  router.delete('/:id', ctrl.deleteNotification);

  return router;
};
