import { describe, expect, it } from 'vitest';
import { modesFinishedOn } from '../../src/storage/playedModes';
import { saveDay, type StorageLike } from '../../src/storage/progressStore';

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const DATE = '2026-10-31';

describe('modesFinishedOn', () => {
  it('lists only the modes whose puzzle of that day is complete', () => {
    const storage = memoryStorage();
    saveDay(storage, DATE, { answers: ['A'], complete: true }, 'lore');
    saveDay(storage, DATE, { answers: ['A'], complete: false }, 'stats');
    // The mixed mode saves under the original key, without a slot.
    saveDay(storage, DATE, { answers: ['A'], complete: true });
    saveDay(storage, '2026-10-30', { answers: ['A'], complete: true }, 'esports');

    expect(modesFinishedOn(storage, DATE)).toEqual(['lore', 'mixed']);
  });

  it('is empty without storage', () => {
    expect(modesFinishedOn(undefined, DATE)).toEqual([]);
  });
});
