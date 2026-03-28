const deviceQueries = require('../db/deviceQueries');

async function register(req, res) {
  try {
    const { pushToken, platform } = req.body;
    const device = await deviceQueries.register(req.user.id, pushToken, platform);
    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register device' });
  }
}

async function unregister(req, res) {
  try {
    const { pushToken } = req.body;
    await deviceQueries.unregister(req.user.id, pushToken);
    res.json({ message: 'Device unregistered' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unregister device' });
  }
}

module.exports = { register, unregister };
