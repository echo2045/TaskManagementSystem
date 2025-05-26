const express = require('express');
const router = express.Router();
const { createArea, getAllAreas } = require('../controllers/areaController');

router.post('/', createArea);
router.get('/', getAllAreas);

module.exports = router;
