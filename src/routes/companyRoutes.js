const { Router } = require('express');
const companyController = require('../controllers/companyController');

const router = Router();

router.get('/', companyController.list);
router.get('/:id', companyController.getById);

module.exports = router;
