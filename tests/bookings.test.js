const request = require('supertest');
const app = require('../src/app');
const { resetDatabase, closeDatabase } = require('./setup');

let token;

beforeAll(async () => {
  await resetDatabase();
  // Create a user and get token
  const res = await request(app).post('/api/auth/signup').send({
    fullName: 'Booking User',
    phone: '07503333333',
    password: 'Test1234',
    city: 'Erbil',
  });
  token = res.body.token;
});

afterAll(() => closeDatabase());

describe('POST /api/bookings', () => {
  it('creates a booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        carId: 'c1000000-0000-0000-0000-000000000001',
        startDate: '2026-04-10',
        endDate: '2026-04-13',
      });
    expect(res.status).toBe(201);
    expect(res.body.total_price).toBe(225000); // 75000 × 3 days
  });

  it('rejects overlapping booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        carId: 'c1000000-0000-0000-0000-000000000001',
        startDate: '2026-04-11',
        endDate: '2026-04-14',
      });
    expect(res.status).toBe(409);
  });

  it('rejects without auth', async () => {
    const res = await request(app).post('/api/bookings').send({
      carId: 'c1000000-0000-0000-0000-000000000001',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/bookings', () => {
  it('returns user bookings', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('rejects without auth', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/bookings/:id/cancel', () => {
  it('cancels a booking', async () => {
    const bookings = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${token}`);
    const bookingId = bookings.body[0].id;

    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('rejects cancelling already cancelled booking', async () => {
    const bookings = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${token}`);
    const cancelledBooking = bookings.body.find((b) => b.status === 'cancelled');

    const res = await request(app)
      .patch(`/api/bookings/${cancelledBooking.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('rejects without auth', async () => {
    const res = await request(app)
      .patch('/api/bookings/00000000-0000-0000-0000-000000000000/cancel');
    expect(res.status).toBe(401);
  });
});
