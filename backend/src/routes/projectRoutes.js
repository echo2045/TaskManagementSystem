// backend/src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  createProject,
  getAllProjects,
  markProjectComplete,
  deleteProject
} = require('../controllers/projectController');

router.post('/', authenticate, createProject);
router.get('/', authenticate, getAllProjects);
router.patch('/:id/complete', authenticate, markProjectComplete);
router.delete('/:id', authenticate, deleteProject);

module.exports = router;
