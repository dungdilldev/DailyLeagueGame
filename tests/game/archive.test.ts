import { describe, expect, it } from 'vitest';
import { ARCHIVE_DAYS, earliestPlayableDate, resolvePuzzleDate } from '../../src/game/archive';
import { addUtcDays } from '../../src/game/date';

const TODAY = '2026-03-10';

describe('earliestPlayableDate', () => {
  it('is ARCHIVE_DAYS before today', () => {
    expect(earliestPlayableDate(TODAY)).toBe(addUtcDays(TODAY, -ARCHIVE_DAYS));
  });
});

describe('resolvePuzzleDate', () => {
  it('returns today when nothing is requested', () => {
    expect(resolvePuzzleDate(null, TODAY)).toBe(TODAY);
    expect(resolvePuzzleDate(undefined, TODAY)).toBe(TODAY);
    expect(resolvePuzzleDate('', TODAY)).toBe(TODAY);
  });

  it('accepts yesterday, today, and the earliest day in the window', () => {
    expect(resolvePuzzleDate('2026-03-09', TODAY)).toBe('2026-03-09');
    expect(resolvePuzzleDate(TODAY, TODAY)).toBe(TODAY);
    expect(resolvePuzzleDate(earliestPlayableDate(TODAY), TODAY)).toBe(earliestPlayableDate(TODAY));
  });

  it('falls back to today for days older than the archive window', () => {
    expect(resolvePuzzleDate(addUtcDays(earliestPlayableDate(TODAY), -1), TODAY)).toBe(TODAY);
    expect(resolvePuzzleDate('2000-01-01', TODAY)).toBe(TODAY);
  });

  it('falls back to today for future days, so upcoming puzzles cannot be opened early', () => {
    expect(resolvePuzzleDate('2026-03-11', TODAY)).toBe(TODAY);
    expect(resolvePuzzleDate('2099-01-01', TODAY)).toBe(TODAY);
  });

  it('falls back to today for garbage input', () => {
    for (const value of ['abc', '2026-02-30', "2026-03-09'; drop", '<script>']) {
      expect(resolvePuzzleDate(value, TODAY), value).toBe(TODAY);
    }
  });
});
