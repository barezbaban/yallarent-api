const request = require('supertest');
const app = require('../src/app');
const { resetDatabase, closeDatabase } = require('./setup');

beforeAll(() => resetDatabase());
afterAll(() => closeDatabase());

describe('POST /api/auth/signup', () => {
  it('creates a new user and returns phone for OTP verification', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Test User',
      phone: '07501111111',
      password: 'Test1234',
      city: 'Erbil',
    });
    expect(res.status).toBe(201);
    expect(res.body.phone).toBe('07501111111');
    expect(res.body.message).toBeDefined();
  });

  it('rejects duplicate phone', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      fullName: 'Another User',
      phone: '07501111111',
      password: 'Test1234',
      city: 'Baghdad',
    });
    expect(res.status).toBe(409);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      phone: '07502222222',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify-signup', () => {
  it('verifies OTP and returns token', async () => {
    const res = await request(app).post('/api/auth/verify-signup').send({
      phone: '07501111111',
      otp: '123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.full_name).toBe('Test User');
  });

  it('rejects invalid OTP', async () => {
    // Sign up a new user to get a fresh OTP
    await request(app).post('/api/auth/signup').send({
      fullName: 'OTP Test',
      phone: '07503333333',
      password: 'Test1234',
      city: 'Erbil',
    });
    const res = await request(app).post('/api/auth/verify-signup').send({
      phone: '07503333333',
      otp: '000000',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '07501111111',
      password: 'Test1234',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '07501111111',
      password: 'wrongpass',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown phone', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone: '07509999999',
      password: 'Test1234',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user with valid token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      phone: '07501111111',
      password: 'Test1234',
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Test User');
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
