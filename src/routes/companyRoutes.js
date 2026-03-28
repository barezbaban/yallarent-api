const { Router } = require('express');
const companyController = require('../controllers/companyController');
const { validateParams } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.get('/', companyController.list);
router.get('/:id', validateParams(schemas.uuidParam), companyController.getById);

module.exports = router;
