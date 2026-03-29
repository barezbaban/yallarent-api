const { Router } = require('express');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerDevice, unregisterDevice } = require('../schemas');
const deviceController = require('../controllers/deviceController');

const router = Router();

router.post('/', auth, validate(registerDevice), deviceController.register);
router.delete('/', auth, validate(unregisterDevice), deviceController.unregister);

module.exports = router;
