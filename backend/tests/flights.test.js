/**
 * @file flights.test.js
 * Jest + Supertest integration tests for the Flights API.
 *
 * A real MongoDB connection is NOT required; mongoose-memory-server or a mock
 * approach can be used. For CI, this suite mocks the service layer so that
 * no external dependencies are needed.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Set required env vars before loading the app
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/skyops_test';

// ─── Mock the service layer ───────────────────────────────────────────────────
jest.mock('../src/services/flightService');
const flightService = require('../src/services/flightService');

// ─── Mock auth middleware so we can control the user in each test ─────────────
jest.mock('../src/middleware/auth', () => {
  const actual = jest.requireActual('../src/middleware/auth');
  return {
    ...actual,
    authenticate: (req, res, next) => {
      // Inject a test user if the Authorization header looks valid
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const role = req.headers['x-test-role'] || 'dispatcher';
        req.user = {
          _id: new (require('mongoose').Types.ObjectId)(),
          username: 'testuser',
          role,
          isActive: true,
          changedPasswordAfter: () => false,
        };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    },
    requireDispatcher: (req, res, next) => {
      if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
      if (!['dispatcher', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      next();
    },
  };
});

// ─── Mock mongoose connection so the app doesn't try to actually connect ──────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: { readyState: 1, close: jest.fn().mockResolvedValue(undefined) },
  };
});

const app = require('../src/index');

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const VALID_TOKEN = 'Bearer valid-test-token';

const mockFlight = {
  _id: new mongoose.Types.ObjectId().toString(),
  flightNumber: 'BA123',
  departure: { icao: 'EGLL', iata: 'LHR', name: 'Heathrow' },
  destination: { icao: 'KJFK', iata: 'JFK', name: 'JFK International' },
  departureTime: '2024-06-01T08:00:00.000Z',
  arrivalTime: '2024-06-01T16:00:00.000Z',
  aircraft: { registration: 'G-STBA', type: 'Boeing 787-9', icaoCode: 'B789' },
  passengers: { booked: 280, checkedIn: 275, capacity: 291 },
  status: 'scheduled',
  crew: [],
  duration: 480,
};

const createFlightPayload = {
  flightNumber: 'BA123',
  departure: { icao: 'EGLL', iata: 'LHR', name: 'Heathrow' },
  destination: { icao: 'KJFK', iata: 'JFK', name: 'JFK International' },
  departureTime: '2024-06-01T08:00:00.000Z',
  arrivalTime: '2024-06-01T16:00:00.000Z',
  aircraft: { registration: 'G-STBA', type: 'Boeing 787-9', icaoCode: 'B789' },
  passengers: { booked: 280, checkedIn: 275, capacity: 291 },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/flights', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/flights');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns paginated flight list', async () => {
    flightService.listFlights.mockResolvedValueOnce({
      flights: [mockFlight],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    });

    const res = await request(app)
      .get('/api/flights')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ total: 1, page: 1 });
  });

  it('filters by status query param', async () => {
    flightService.listFlights.mockResolvedValueOnce({
      flights: [mockFlight],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    });

    const res = await request(app)
      .get('/api/flights?status=scheduled')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(flightService.listFlights).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'scheduled' })
    );
  });

  it('returns 422 for an invalid status filter', async () => {
    const res = await request(app)
      .get('/api/flights?status=invalid_status')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/flights/:id', () => {
  it('returns a single flight', async () => {
    flightService.getFlightById.mockResolvedValueOnce(mockFlight);

    const res = await request(app)
      .get(`/api/flights/${mockFlight._id}`)
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.data.flightNumber).toBe('BA123');
  });

  it('returns 404 when flight is not found', async () => {
    flightService.getFlightById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get(`/api/flights/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/flights', () => {
  it('returns 403 for pilot role (insufficient permissions)', async () => {
    const res = await request(app)
      .post('/api/flights')
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'pilot')
      .send(createFlightPayload);

    expect(res.status).toBe(403);
  });

  it('creates a new flight as dispatcher', async () => {
    flightService.createFlight.mockResolvedValueOnce({ ...mockFlight });

    const res = await request(app)
      .post('/api/flights')
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher')
      .send(createFlightPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.flightNumber).toBe('BA123');
  });

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/flights')
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher')
      .send({ flightNumber: 'BA123' }); // missing required fields

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 422 for an invalid flightNumber format', async () => {
    const payload = { ...createFlightPayload, flightNumber: 'NOT_VALID' };

    const res = await request(app)
      .post('/api/flights')
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher')
      .send(payload);

    expect(res.status).toBe(422);
  });
});

describe('PUT /api/flights/:id', () => {
  it('updates a flight as dispatcher', async () => {
    const updated = { ...mockFlight, status: 'boarding' };
    flightService.updateFlight.mockResolvedValueOnce(updated);

    const res = await request(app)
      .put(`/api/flights/${mockFlight._id}`)
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher')
      .send({ status: 'boarding' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('boarding');
  });

  it('returns 404 when the flight does not exist', async () => {
    flightService.updateFlight.mockResolvedValueOnce(null);

    const res = await request(app)
      .put(`/api/flights/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher')
      .send({ status: 'boarding' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/flights/:id', () => {
  it('deletes a flight as dispatcher', async () => {
    flightService.deleteFlight.mockResolvedValueOnce(mockFlight);

    const res = await request(app)
      .delete(`/api/flights/${mockFlight._id}`)
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher');

    expect(res.status).toBe(204);
  });

  it('returns 404 when the flight does not exist', async () => {
    flightService.deleteFlight.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete(`/api/flights/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', VALID_TOKEN)
      .set('x-test-role', 'dispatcher');

    expect(res.status).toBe(404);
  });
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Unknown routes', () => {
  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
