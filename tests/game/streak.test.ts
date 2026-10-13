import { describe, expect, it } from 'vitest';
import { currentStreak } from '../../src/game/streak';

describe('currentStreak', () => {
  it('is zero with no history', () => {
    expect(currentStreak([], '2026-03-05')).toBe(0);
  });

  it('counts consecutive days including today', () => {
    expect(currentStreak(['2026-03-03', '2026-03-04', '2026-03-05'], '2026-03-05')).toBe(3);
  });

  it('stays alive when today is not played yet', () => {
    expect(currentStreak(['2026-03-03', '2026-03-04'], '2026-03-05')).toBe(2);
  });

  it('resets after a missed day', () => {
    expect(currentStreak(['2026-03-01', '2026-03-02'], '2026-03-05')).toBe(0);
  });

  it('stops at a gap and counts across month boundaries', () => {
    expect(currentStreak(['2026-02-27', '2026-03-01', '2026-02-28'], '2026-03-01')).toBe(3);
    expect(currentStreak(['2026-02-20', '2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2);
  });
});
