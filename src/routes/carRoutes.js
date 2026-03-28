const { Router } = require('express');
const carController = require('../controllers/carController');

const router = Router();

router.get('/', carController.list);
router.get('/:id', carController.getById);

module.exports = router;
