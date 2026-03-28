const carQueries = require('../db/carQueries');

async function list(req, res) {
  try {
    const { city, min_price, max_price } = req.query;
    const cars = await carQueries.findAll({
      city,
      minPrice: min_price ? Number(min_price) : undefined,
      maxPrice: max_price ? Number(max_price) : undefined,
    });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
}

async function getById(req, res) {
  try {
    const car = await carQueries.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch car' });
  }
}

module.exports = { list, getById };
