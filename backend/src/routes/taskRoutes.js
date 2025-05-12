// backend/src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  createTask,
  markTaskAsComplete,
  getArchivedTasks
} = require('../controllers/taskController');




router.get('/tasks', getAllTasks);
router.post('/tasks', createTask);

router.put('/tasks/:id/complete', markTaskAsComplete);

router.get('/tasks/archive', getArchivedTasks);


module.exports = router;
