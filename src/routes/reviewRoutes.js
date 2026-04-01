const { Router } = require('express');
const reviewController = require('../controllers/reviewController');
const authenticate = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validate');
const schemas = require('../schemas');

const router = Router();

router.post('/', authenticate, validate(schemas.createReview), reviewController.create);
router.get('/car/:carId', validateParams(schemas.carIdParam), reviewController.getByCarId);
router.get('/booking/:id', authenticate, validateParams(schemas.uuidParam), reviewController.getByBookingId);

module.exports = router;
