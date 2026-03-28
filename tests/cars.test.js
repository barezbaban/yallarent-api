const request = require('supertest');
const app = require('../src/app');
const { resetDatabase, closeDatabase } = require('./setup');

beforeAll(() => resetDatabase());
afterAll(() => closeDatabase());

describe('GET /api/cars', () => {
  it('returns paginated list of cars', async () => {
    const res = await request(app).get('/api/cars');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBeDefined();
  });

  it('filters by city', async () => {
    const res = await request(app).get('/api/cars?city=Erbil');
    expect(res.status).toBe(200);
    res.body.data.forEach((car) => {
      expect(car.city).toBe('Erbil');
    });
  });

  it('returns empty data for unknown city', async () => {
    const res = await request(app).get('/api/cars?city=UnknownCity');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe('GET /api/cars/:id', () => {
  it('returns a single car', async () => {
    const res = await request(app).get('/api/cars/c1000000-0000-0000-0000-000000000001');
    expect(res.status).toBe(200);
    expect(res.body.make).toBe('Toyota');
    expect(res.body.model).toBe('Corolla');
  });

  it('returns 404 for unknown car', async () => {
    const res = await request(app).get('/api/cars/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
