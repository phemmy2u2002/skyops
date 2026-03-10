import { describe, it, expect } from 'vitest';
import {
  formatUTC,
  formatDuration,
  feetToFL,
  formatWind,
  formatFuel,
  normalizeIcao,
} from './formatters.js';

describe('formatUTC', () => {
  it('returns 4-digit UTC time string for a valid ISO date', () => {
    expect(formatUTC('2024-03-15T14:35:00Z')).toBe('1435');
  });

  it('returns — for null', () => {
    expect(formatUTC(null)).toBe('—');
  });

  it('returns — for an invalid string', () => {
    expect(formatUTC('not-a-date')).toBe('—');
  });
});

describe('formatDuration', () => {
  it('formats duration between two ISO dates', () => {
    const from = '2024-03-15T10:00:00Z';
    const to = '2024-03-15T12:30:00Z';
    const result = formatDuration(from, to);
    expect(result).toContain('2');
    expect(result).toMatch(/h|hour/);
  });

  it('returns — when from is null', () => {
    expect(formatDuration(null, '2024-03-15T12:00:00Z')).toBe('—');
  });

  it('returns — when arrival is before departure', () => {
    expect(formatDuration('2024-03-15T12:00:00Z', '2024-03-15T10:00:00Z')).toBe('—');
  });
});

describe('feetToFL', () => {
  it('converts feet to flight level string', () => {
    expect(feetToFL(35000)).toBe('FL350');
    expect(feetToFL(10000)).toBe('FL100');
  });

  it('returns — for null', () => {
    expect(feetToFL(null)).toBe('—');
  });
});

describe('formatWind', () => {
  it('formats a standard wind report', () => {
    expect(formatWind(270, 15)).toBe('270°/15kt');
  });

  it('includes gust when provided', () => {
    expect(formatWind(180, 20, 30)).toBe('180°/20G30kt');
  });

  it('returns CALM for zero speed', () => {
    expect(formatWind(0, 0)).toBe('CALM');
  });

  it('returns — when speed is undefined', () => {
    expect(formatWind(270, undefined)).toBe('—');
  });
});

describe('formatFuel', () => {
  it('formats kg', () => {
    expect(formatFuel(10000)).toBe('10,000 kg');
  });

  it('formats lbs', () => {
    const result = formatFuel(1000, 'lbs');
    expect(result).toContain('lbs');
  });

  it('returns — for null', () => {
    expect(formatFuel(null)).toBe('—');
  });
});

describe('normalizeIcao', () => {
  it('uppercases and trims the code', () => {
    expect(normalizeIcao('  kjfk  ')).toBe('KJFK');
  });

  it('handles null gracefully', () => {
    expect(normalizeIcao(null)).toBe('');
  });
});
