const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getArchivedTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  getTaskAssignees,
  assignTask,
  unassignTask,
  markAssignmentCompleted,
  updateAssignmentStartDate,
  updateTaskDetails
} = require('../controllers/taskController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Task CRUD
router.get('/', getAllTasks);
router.get('/archive/:user_id', getArchivedTasksForUser);
router.post('/', createTask);
router.patch('/:task_id', updateTask);
router.put('/:task_id', updateTaskDetails);
router.delete('/:task_id', deleteTask);

// Assignees
router.get('/:task_id/assignees', getTaskAssignees);
router.post('/:task_id/assignees', assignTask);
router.delete('/:task_id/assignees/:userId', unassignTask);

// Completion + Start date
router.patch('/:task_id/assignment/:userId/complete', markAssignmentCompleted);
router.patch('/:task_id/assignment/:userId/start-date', updateAssignmentStartDate);

module.exports = router;
