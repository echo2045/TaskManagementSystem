const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  createArea,
  getAllAreas,
  markAreaComplete,
  deleteArea
} = require('../controllers/areaController');

// All routes require authentication
router.post('/', authenticate, createArea);
router.get('/', authenticate, getAllAreas);
router.patch('/:id/complete', authenticate, markAreaComplete);
router.delete('/:id', authenticate, deleteArea);

module.exports = router;
