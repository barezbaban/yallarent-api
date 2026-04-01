const reviewQueries = require('../db/reviewQueries');
const bookingQueries = require('../db/bookingQueries');

async function create(req, res) {
  try {
    const { bookingId, rating, reviewText } = req.body;

    const booking = await bookingQueries.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renter_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'You can only review completed bookings' });

    const existing = await reviewQueries.findByBookingId(bookingId);
    if (existing) return res.status(409).json({ error: 'You have already reviewed this booking' });

    const review = await reviewQueries.create({
      bookingId,
      carId: booking.car_id,
      userId: req.user.id,
      rating,
      reviewText,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create review' });
  }
}

async function getByCarId(req, res) {
  try {
    const { carId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const [reviews, stats] = await Promise.all([
      reviewQueries.findByCarId(carId, { limit, offset }),
      reviewQueries.getCarRatingStats(carId),
    ]);

    res.json({
      reviews,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

async function getByBookingId(req, res) {
  try {
    const booking = await bookingQueries.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renter_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });

    const review = await reviewQueries.findByBookingId(req.params.id);
    if (!review) return res.status(404).json({ error: 'No review for this booking' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
}

module.exports = { create, getByCarId, getByBookingId };
