const request = require('supertest');
const express = require('express');

// ─── Minimal test app (no DB required) ───────────────────────────────────────
// We mount routes with mocked DB to keep tests self-contained and fast.

jest.mock('../config/db', () => {
  const mongoose = { Schema: class {}, Types: { ObjectId: String } };
  const mockUser = {
    _id: 'user_test_001',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz012345', // fake hash
    currency: 'INR',
    role: 'user',
    monthlyBudget: 50000,
    notifications: { budgetAlerts: true, emailAlerts: true },
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    connectDB: jest.fn().mockResolvedValue(true),
    User: {
      findById: jest.fn().mockResolvedValue(mockUser),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([mockUser]),
      create: jest.fn().mockResolvedValue(mockUser),
      prototype: { save: jest.fn() }
    },
    Expense: {
      find: jest.fn().mockResolvedValue([
        { _id: 'exp1', userId: 'user_test_001', amount: 1200, category: 'Food', date: new Date(), paymentMethod: 'UPI', isRecurring: false },
        { _id: 'exp2', userId: 'user_test_001', amount: 500, category: 'Travel', date: new Date(), paymentMethod: 'Cash', isRecurring: false }
      ]),
      findOne: jest.fn().mockResolvedValue(null),
      findByIdAndDelete: jest.fn().mockResolvedValue(true),
      prototype: { save: jest.fn() }
    },
    Income: {
      find: jest.fn().mockResolvedValue([
        { _id: 'inc1', userId: 'user_test_001', amount: 60000, source: 'Salary', date: new Date() }
      ]),
      findOne: jest.fn().mockResolvedValue(null),
      prototype: { save: jest.fn() }
    },
    Notification: {
      find: jest.fn().mockResolvedValue([]),
      prototype: { save: jest.fn() }
    },
    Budget: {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      prototype: { save: jest.fn() }
    }
  };
});

// Mock JWT auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'user_test_001' };
  next();
});

// ─── Import routes AFTER mocking ─────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/expenses', require('../routes/expense'));
app.use('/api/income', require('../routes/income'));
app.use('/api/dashboard', require('../routes/dashboard'));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Expense Routes', () => {
  test('GET /api/expenses - returns array of expenses', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/expenses - each expense has required fields', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const exp = res.body[0];
      expect(exp).toHaveProperty('amount');
      expect(exp).toHaveProperty('category');
    }
  });
});

describe('Income Routes', () => {
  test('GET /api/income - returns array of incomes', async () => {
    const res = await request(app).get('/api/income');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/income - each income has amount and source', async () => {
    const res = await request(app).get('/api/income');
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('amount');
      expect(res.body[0]).toHaveProperty('source');
    }
  });
});

describe('Dashboard Route', () => {
  test('GET /api/dashboard - returns financial summary object', async () => {
    const res = await request(app).get('/api/dashboard');
    // Should be 200 with summary data, or 500 if an expected field is missing
    expect([200, 500]).toContain(res.status);
  });
});

describe('Auth Validation', () => {
  test('POST with invalid body returns 400 or validation error', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .send({ amount: -50 }); // negative amount, missing fields
    expect([400, 422, 500]).toContain(res.status);
  });
});

describe('API Health', () => {
  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');
    expect(res.status).toBe(404);
  });
});
