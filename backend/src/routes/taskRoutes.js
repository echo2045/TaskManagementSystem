const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

const {
  getAllTasks,
  getArchivedTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  getTaskAssignees,
  assignTask,
  unassignTask,
  markAssignmentCompleted // ✅ Import was missing
} = require('../controllers/taskController');

// Main task endpoints
router.get('/', authenticate, getAllTasks);
router.get('/archive/:id', authenticate, getArchivedTasksForUser);
router.post('/', authenticate, createTask);
router.patch('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

// Assignee endpoints
router.get('/:id/assignees', authenticate, getTaskAssignees);
router.post('/:id/assignees', authenticate, assignTask);
router.delete('/:id/assignees/:userId', authenticate, unassignTask);

// ✅ NEW: Mark assignee completion
router.patch('/:taskId/assignment/:userId/complete', authenticate, markAssignmentCompleted);

module.exports = router;
