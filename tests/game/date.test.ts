import { describe, expect, it } from 'vitest';
import { addUtcDays, formatCountdown, formatUtcDate, msUntilNextUtcDay } from '../../src/game/date';

describe('formatUtcDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(formatUtcDate(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05');
  });

  it('uses UTC, not local time, at the day boundary', () => {
    expect(formatUtcDate(new Date('2026-03-05T23:59:59Z'))).toBe('2026-03-05');
    expect(formatUtcDate(new Date('2026-03-06T00:00:00Z'))).toBe('2026-03-06');
  });
});

describe('addUtcDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addUtcDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addUtcDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles leap days and zero offset', () => {
    expect(addUtcDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addUtcDays('2026-03-05', 0)).toBe('2026-03-05');
  });
});

describe('countdown', () => {
  it('measures time until the next UTC midnight', () => {
    expect(msUntilNextUtcDay(new Date('2026-03-05T23:00:00Z'))).toBe(60 * 60 * 1000);
    expect(msUntilNextUtcDay(new Date('2026-03-05T00:00:00Z'))).toBe(24 * 60 * 60 * 1000);
  });

  it('formats as HH:MM:SS', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});
