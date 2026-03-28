const favoriteQueries = require('../db/favoriteQueries');

async function list(req, res) {
  try {
    const favorites = await favoriteQueries.findByUser(req.user.id);
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}

async function add(req, res) {
  try {
    const { carId } = req.body;
    if (!carId) return res.status(400).json({ error: 'carId is required' });
    await favoriteQueries.add(req.user.id, carId);
    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
}

async function remove(req, res) {
  try {
    const removed = await favoriteQueries.remove(req.user.id, req.params.carId);
    if (!removed) return res.status(404).json({ error: 'Favorite not found' });
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
}

async function getIds(req, res) {
  try {
    const ids = await favoriteQueries.getCarIds(req.user.id);
    res.json(ids);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorite IDs' });
  }
}

module.exports = { list, add, remove, getIds };
