const { Router } = require('express');
const auth = require('../middleware/auth');
const deviceController = require('../controllers/deviceController');

const router = Router();

router.post('/', auth, deviceController.register);
router.delete('/', auth, deviceController.unregister);

module.exports = router;
