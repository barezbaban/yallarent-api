const { Router } = require('express');
const favoriteController = require('../controllers/favoriteController');
const authenticate = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.get('/', authenticate, favoriteController.list);
router.get('/ids', authenticate, favoriteController.getIds);
router.post('/', authenticate, validate(schemas.addFavorite), favoriteController.add);
router.delete('/:carId', authenticate, validateParams(schemas.carIdParam), favoriteController.remove);

module.exports = router;
