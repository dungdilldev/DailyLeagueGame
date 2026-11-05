import { describe, expect, it } from 'vitest';
import { optionLookup, pickPuzzleDay, type PuzzleDay } from '../../src/game/puzzleDays';

const day = (date: string): PuzzleDay => ({
  puzzle: { date, rounds: [] },
  options: {
    champion: { Ahri: { id: 'Ahri', name: 'Ahri', iconUrl: 'images/icons/a.png', stats: {} } },
    item: {},
    ability: {},
    text: {},
  },
});

describe('pickPuzzleDay', () => {
  const days = [day('2026-03-05'), day('2026-03-06')];

  it("picks today's puzzle, and tomorrow's once the day has changed", () => {
    expect(pickPuzzleDay(days, '2026-03-05')).toEqual({ day: days[0], isToday: true });
    expect(pickPuzzleDay(days, '2026-03-06')).toEqual({ day: days[1], isToday: true });
  });

  it('falls back to the newest puzzle when the page has none for today (a missed build)', () => {
    expect(pickPuzzleDay(days, '2026-03-08')).toEqual({ day: days[1], isToday: false });
    expect(pickPuzzleDay([...days].reverse(), '2026-03-08')?.day).toBe(days[1]);
  });

  it('has nothing to pick from a page without puzzles', () => {
    expect(pickPuzzleDay([], '2026-03-05')).toBeUndefined();
  });
});

describe('optionLookup', () => {
  it('turns the options back into lookups by subject', () => {
    const lookup = optionLookup(day('2026-03-05'));
    expect(lookup.champion.get('Ahri')?.name).toBe('Ahri');
    expect(lookup.text.size).toBe(0);
  });
});
