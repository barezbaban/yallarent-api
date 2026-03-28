const request = require('supertest');
const app = require('../src/app');
const { resetDatabase, closeDatabase } = require('./setup');

beforeAll(() => resetDatabase());
afterAll(() => closeDatabase());

describe('GET /api/cars', () => {
  it('returns list of cars', async () => {
    const res = await request(app).get('/api/cars');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('filters by city', async () => {
    const res = await request(app).get('/api/cars?city=Erbil');
    expect(res.status).toBe(200);
    res.body.forEach((car) => {
      expect(car.city).toBe('Erbil');
    });
  });

  it('returns empty array for unknown city', async () => {
    const res = await request(app).get('/api/cars?city=UnknownCity');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
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
