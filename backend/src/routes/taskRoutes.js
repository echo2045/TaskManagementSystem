const express = require('express');

module.exports = (io) => {
  const router = express.Router();
  const taskController = require('../controllers/taskController')(io); // Pass io to controller
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
    updateTaskDetails,
    startWorkSession,
    stopWorkSession,
    getWorkHistory,
    getCurrentTask,
    getTaskById
  } = taskController;
  const authenticate = require('../middleware/auth');

  router.use(authenticate);

  // Task CRUD
  router.get('/', getAllTasks);
  router.get('/:task_id', getTaskById);
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

  // Work Sessions
  router.post('/:taskId/start', startWorkSession);
  router.post('/stop', stopWorkSession);
  router.get('/users/:userId/work-history', getWorkHistory);
  router.get('/users/:userId/current-task', getCurrentTask);

  return router;
};