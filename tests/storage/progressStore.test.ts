import { describe, expect, it } from 'vitest';
import {
  completedDates,
  loadSavedDays,
  saveDay,
  type StorageLike,
} from '../../src/storage/progressStore';

function memoryStorage(initial?: string): StorageLike & { value: string | null } {
  return {
    value: initial ?? null,
    getItem() {
      return this.value;
    },
    setItem(_key, value) {
      this.value = value;
    },
  };
}

const record = { answers: ['A'], complete: false };

describe('progress store', () => {
  it('round-trips a saved day and keeps other days', () => {
    const storage = memoryStorage();
    saveDay(storage, '2026-03-04', { answers: ['A', 'B'], complete: true });
    saveDay(storage, '2026-03-05', record);
    const days = loadSavedDays(storage);
    expect(Object.keys(days)).toEqual(['2026-03-04', '2026-03-05']);
    expect(completedDates(days)).toEqual(['2026-03-04']);
  });

  it('does not count days played late as completed for the streak', () => {
    const storage = memoryStorage();
    saveDay(storage, '2026-03-03', { answers: ['A'], complete: true, late: true });
    saveDay(storage, '2026-03-04', { answers: ['A'], complete: true });
    expect(completedDates(loadSavedDays(storage))).toEqual(['2026-03-04']);
  });

  it('still reads progress saved before the late flag existed', () => {
    const old = memoryStorage('{"2026-03-04":{"answers":["A"],"complete":true}}');
    expect(completedDates(loadSavedDays(old))).toEqual(['2026-03-04']);
  });

  it('treats corrupt or wrongly shaped data as empty', () => {
    expect(loadSavedDays(memoryStorage('not json'))).toEqual({});
    expect(loadSavedDays(memoryStorage('{"2026-03-05":{"answers":"x"}}'))).toEqual({});
  });

  it('survives storage that throws, and missing storage', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSavedDays(broken)).toEqual({});
    expect(() => {
      saveDay(broken, '2026-03-05', record);
    }).not.toThrow();
    expect(loadSavedDays(undefined)).toEqual({});
    expect(() => {
      saveDay(undefined, '2026-03-05', record);
    }).not.toThrow();
  });
});
