import { describe, expect, it } from 'vitest';
import { formatUtcDate } from '../../src/game/date';

describe('formatUtcDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(formatUtcDate(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05');
  });

  it('uses UTC, not local time, at the day boundary', () => {
    expect(formatUtcDate(new Date('2026-03-05T23:59:59Z'))).toBe('2026-03-05');
    expect(formatUtcDate(new Date('2026-03-06T00:00:00Z'))).toBe('2026-03-06');
  });
});
