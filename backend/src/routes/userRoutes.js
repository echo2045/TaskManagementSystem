// backend/src/routes/userRoutes.js
const express = require('express');
const router  = express.Router();
const userController = require('../controllers/userController');

// CRUD on /api/users
router.get   ('/',                userController.getAllUsers);
router.get   ('/:id',             userController.getUserById);
router.post  ('/',                userController.createUser);
router.patch ('/:id',             userController.updateUser);
router.delete('/:id',             userController.deleteUser);

// Dynamic Role Assignment
router.get   ('/:id/supervisees',               userController.getSupervisees);
router.post  ('/:id/supervisees',               userController.assignSupervisee);
router.delete('/:id/supervisees/:superviseeId', userController.unassignSupervisee);

module.exports = router;
