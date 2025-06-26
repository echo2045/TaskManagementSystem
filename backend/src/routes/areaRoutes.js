const express = require('express');
const router = express.Router();
const {
  createArea,
  getAllAreas,
  markAreaComplete,
  deleteArea,
  updateArea
} = require('../controllers/areaController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Area routes
router.post('/', createArea);
router.get('/', getAllAreas);
router.patch('/:area_id/complete', markAreaComplete);
router.delete('/:area_id', deleteArea);
router.patch('/:area_id', updateArea); // rename area

module.exports = router;
