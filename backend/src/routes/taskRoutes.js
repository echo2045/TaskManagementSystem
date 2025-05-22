// backend/src/routes/taskRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllTasks,
  getArchivedTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  getTaskAssignees,
  assignTask,
  unassignTask
} = require('../controllers/taskController');

// Now these are **relative** to /api/tasks
router.get   ('/',                   getAllTasks);
router.get   ('/archive',            getArchivedTasksForUser);
router.post  ('/',                   createTask);
router.patch ('/:id',                updateTask);
router.delete('/:id',                deleteTask);

// Delegation endpoints
router.get   ('/:id/assignees',           getTaskAssignees);
router.post  ('/:id/assignees',           assignTask);
router.delete('/:id/assignees/:userId',   unassignTask);

module.exports = router;
