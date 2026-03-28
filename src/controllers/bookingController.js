const bookingQueries = require('../db/bookingQueries');
const carQueries = require('../db/carQueries');

async function create(req, res) {
  try {
    const { carId, startDate, endDate } = req.body;
    const renterId = req.user.id;

    const car = await carQueries.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const days = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = days * car.price_per_day;

    // Atomic transaction: locks car row, checks overlap, then inserts
    const result = await bookingQueries.create({
      carId,
      renterId,
      startDate,
      endDate,
      totalPrice,
    });

    if (result.conflict) {
      return res.status(409).json({ error: result.reason });
    }

    res.status(201).json(result.booking);
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

async function cancel(req, res) {
  try {
    const booking = await bookingQueries.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renter_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }
    if (new Date(booking.start_date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel a booking that has already started' });
    }
    const updated = await bookingQueries.cancel(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

module.exports = { create, myBookings, getById, cancel };
