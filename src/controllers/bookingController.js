const bookingQueries = require('../db/bookingQueries');
const carQueries = require('../db/carQueries');

async function create(req, res) {
  try {
    const { carId, startDate, endDate } = req.body;
    const renterId = req.user.id;

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ error: 'carId, startDate, and endDate are required' });
    }

    const car = await carQueries.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (!car.is_available) return res.status(400).json({ error: 'Car is not available' });

    const overlap = await bookingQueries.hasOverlap(carId, startDate, endDate);
    if (overlap) return res.status(409).json({ error: 'Car is already booked for those dates' });

    const days = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = days * car.price_per_day;

    const booking = await bookingQueries.create({
      carId,
      renterId,
      startDate,
      endDate,
      totalPrice,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
}

async function myBookings(req, res) {
  try {
    const bookings = await bookingQueries.findByRenter(req.user.id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

async function getById(req, res) {
  try {
    const booking = await bookingQueries.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renter_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

module.exports = { create, myBookings, getById };
