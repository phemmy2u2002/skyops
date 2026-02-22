import { describe, it, expect } from 'vitest';
import {
  validateIcao,
  validateIata,
  validateFlightNumber,
  validateRegistration,
  isRequired,
  isValidDate,
  isValidEmail,
  validateFlightForm,
  validateLoginForm,
} from './validators.js';

describe('validateIcao', () => {
  it('accepts valid 4-letter uppercase ICAO codes', () => {
    expect(validateIcao('KJFK')).toBe(true);
    expect(validateIcao('EGLL')).toBe(true);
  });

  it('rejects codes that are too short or too long', () => {
    expect(validateIcao('KJF')).toBe(false);
    expect(validateIcao('KJFKX')).toBe(false);
  });

  it('rejects non-letter characters', () => {
    expect(validateIcao('K1FK')).toBe(false);
  });
});

describe('validateFlightNumber', () => {
  it('accepts valid airline flight numbers', () => {
    expect(validateFlightNumber('SKY001')).toBe(true);
    expect(validateFlightNumber('BA2')).toBe(true);
    expect(validateFlightNumber('AAL123')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(validateFlightNumber('1234')).toBe(false);
    expect(validateFlightNumber('')).toBe(false);
  });
});

describe('validateRegistration', () => {
  it('accepts common registration formats', () => {
    expect(validateRegistration('N12345')).toBe(true);
    expect(validateRegistration('G-ABCD')).toBe(true);
  });
});

describe('isRequired', () => {
  it('returns true for non-empty strings', () => {
    expect(isRequired('hello')).toBe(true);
  });

  it('returns false for empty/null/undefined', () => {
    expect(isRequired('')).toBe(false);
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
    expect(isRequired('   ')).toBe(false);
  });
});

describe('isValidDate', () => {
  it('returns true for valid ISO strings', () => {
    expect(isValidDate('2024-03-15T10:00:00Z')).toBe(true);
  });

  it('returns false for invalid strings', () => {
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('pilot@skyops.aero')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain')).toBe(false);
  });
});

describe('validateFlightForm', () => {
  const validForm = {
    flightNumber: 'SKY001',
    originIcao: 'KJFK',
    destinationIcao: 'KLAX',
    scheduledDeparture: '2024-06-01T10:00',
    scheduledArrival: '2024-06-01T15:00',
  };

  it('returns no errors for a valid form', () => {
    expect(validateFlightForm(validForm)).toEqual({});
  });

  it('requires flightNumber', () => {
    const errors = validateFlightForm({ ...validForm, flightNumber: '' });
    expect(errors.flightNumber).toBeTruthy();
  });

  it('rejects same origin and destination', () => {
    const errors = validateFlightForm({ ...validForm, destinationIcao: 'KJFK' });
    expect(errors.destinationIcao).toBeTruthy();
  });

  it('rejects arrival before departure', () => {
    const errors = validateFlightForm({
      ...validForm,
      scheduledArrival: '2024-06-01T08:00',
    });
    expect(errors.scheduledArrival).toBeTruthy();
  });
});

describe('validateLoginForm', () => {
  it('returns no errors for valid credentials', () => {
    expect(validateLoginForm({ email: 'user@test.com', password: 'secret123' })).toEqual({});
  });

  it('requires email', () => {
    const errors = validateLoginForm({ email: '', password: 'secret123' });
    expect(errors.email).toBeTruthy();
  });

  it('requires password of at least 6 chars', () => {
    const errors = validateLoginForm({ email: 'user@test.com', password: '12' });
    expect(errors.password).toBeTruthy();
  });
});
