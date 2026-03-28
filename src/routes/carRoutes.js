const { Router } = require('express');
const carController = require('../controllers/carController');
const { validateQuery, validateParams } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.get('/', validateQuery(schemas.carListQuery), carController.list);
router.get('/:id', validateParams(schemas.uuidParam), carController.getById);

module.exports = router;
