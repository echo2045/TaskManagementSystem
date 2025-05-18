const express = require('express');
const router  = express.Router();
const userController = require('../controllers/userController');

// Standard CRUD
router.get   ('/',                userController.getAllUsers);
router.get   ('/:id',             userController.getUserById);
router.post  ('/',                userController.createUser);
router.patch ('/:id',             userController.updateUser);
router.delete('/:id',             userController.deleteUser);

// Dynamic Role Assignment
router.get   ('/:id/supervisees',               userController.getSupervisees);
router.post  ('/:id/supervisees',               userController.assignSupervisee);
router.delete('/:id/supervisees/:superviseeId', userController.unassignSupervisee);

// Change Password
router.patch('/:id/password', userController.changePassword);

module.exports = router;
