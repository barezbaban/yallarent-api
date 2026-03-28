const { Router } = require('express');
const favoriteController = require('../controllers/favoriteController');
const authenticate = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, favoriteController.list);
router.get('/ids', authenticate, favoriteController.getIds);
router.post('/', authenticate, favoriteController.add);
router.delete('/:carId', authenticate, favoriteController.remove);

module.exports = router;
