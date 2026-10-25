import { describe, it, expect } from 'vitest';

function parsePeriodDays(rawPeriod: unknown): number {
  const parsedDays = Number(rawPeriod);
  return Number.isFinite(parsedDays) && parsedDays > 0
    ? parsedDays
    : rawPeriod === 'week'
      ? 7
      : rawPeriod === 'all'
        ? 365
        : 30;
}

describe('Analytics Period Parsing', () => {
  it('parses numeric period strings accurately', () => {
    expect(parsePeriodDays('7')).toBe(7);
    expect(parsePeriodDays('30')).toBe(30);
    expect(parsePeriodDays('90')).toBe(90);
    expect(parsePeriodDays('365')).toBe(365);
  });

  it('parses named aliases correctly', () => {
    expect(parsePeriodDays('week')).toBe(7);
    expect(parsePeriodDays('all')).toBe(365);
  });

  it('falls back to 30 days on undefined or invalid inputs', () => {
    expect(parsePeriodDays(undefined)).toBe(30);
    expect(parsePeriodDays('')).toBe(30);
    expect(parsePeriodDays('invalid_period')).toBe(30);
    expect(parsePeriodDays(-10)).toBe(30);
  });
});
