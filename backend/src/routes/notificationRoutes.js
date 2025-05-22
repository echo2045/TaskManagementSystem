// backend/src/routes/notificationRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notificationController');

// fetch for user
router.get('/user/:id',           ctrl.getNotificationsForUser);

// mark all read for user
router.patch('/user/:id/mark-read', ctrl.markNotificationsRead);

// delete one
router.delete('/:id',             ctrl.deleteNotification);

module.exports = router;
