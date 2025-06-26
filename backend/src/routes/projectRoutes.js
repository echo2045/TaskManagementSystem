const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  markProjectComplete,
  deleteProject,
  updateProject
} = require('../controllers/projectController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Project routes
router.post('/', createProject);
router.get('/', getAllProjects);
router.patch('/:project_id/complete', markProjectComplete);
router.delete('/:project_id', deleteProject);
router.patch('/:project_id', updateProject); // rename project

module.exports = router;
