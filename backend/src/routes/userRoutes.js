// backend/src/routes/userRoutes.js
const express        = require('express');
const router         = express.Router();
const userController = require('../controllers/userController');

// Protected via authenticate in index.js
router.get   ('/',                   userController.getAllUsers);
router.get   ('/:id',                userController.getUserById);
router.post  ('/',                   userController.createUser);
router.patch ('/:id',                userController.updateUser);
router.delete('/:id',                userController.deleteUser);

// Supervisors
router.get   ('/:id/supervisees',               userController.getSupervisees);
router.post  ('/:id/supervisees',               userController.assignSupervisee);
router.delete('/:id/supervisees/:superviseeId', userController.unassignSupervisee);

// Change Password
router.patch('/:id/password', userController.changePassword);

// ── New Task Lists for a User ──
router.get   ('/:id/tasks',         userController.getUserTasks);
router.get   ('/:id/tasks/archive', userController.getUserArchivedTasks);

module.exports = router;
