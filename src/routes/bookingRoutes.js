const { Router } = require('express');
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middleware/auth');

const router = Router();

router.post('/', authenticate, bookingController.create);
router.get('/', authenticate, bookingController.myBookings);
router.get('/:id', authenticate, bookingController.getById);

module.exports = router;
