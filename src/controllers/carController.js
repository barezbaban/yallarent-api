const carQueries = require('../db/carQueries');

async function list(req, res) {
  try {
    const { city, min_price, max_price, category, transmission, min_passengers, min_luggage, page, limit } = req.query;
    const result = await carQueries.findAll({
      city,
      minPrice: min_price,
      maxPrice: max_price,
      category,
      transmission,
      minPassengers: min_passengers,
      minLuggage: min_luggage,
      page: page || 1,
      limit: limit || 20,
    });
    res.json(result);
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
