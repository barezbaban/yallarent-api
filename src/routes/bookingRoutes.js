const { Router } = require('express');
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.post('/', authenticate, validate(schemas.createBooking), bookingController.create);
router.get('/', authenticate, bookingController.myBookings);
router.get('/:id', authenticate, validateParams(schemas.uuidParam), bookingController.getById);
router.patch('/:id/cancel', authenticate, validateParams(schemas.uuidParam), bookingController.cancel);

module.exports = router;
