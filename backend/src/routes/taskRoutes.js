// backend/src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getArchivedTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  getAssignees,
  addAssignee,
  removeAssignee,
  markAssigneeComplete,
  updateAssignmentStartDate,
  updateTaskDetails
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Task CRUD
router.get('/', getAllTasks);
router.get('/archive/:user_id', getArchivedTasksForUser);
router.post('/', createTask);
router.patch('/:task_id', updateTask);
router.put('/:task_id', updateTaskDetails); // 🔥 NEW

router.delete('/:task_id', deleteTask);

// Assignees
router.get('/:task_id/assignees', getAssignees);
router.post('/:task_id/assignees', addAssignee);
router.delete('/:task_id/assignees/:user_id', removeAssignee);

// Completion + Start date
router.patch('/:task_id/assignment/:user_id/complete', markAssigneeComplete);
router.patch('/:task_id/assignment/:user_id/start-date', updateAssignmentStartDate);

module.exports = router;
