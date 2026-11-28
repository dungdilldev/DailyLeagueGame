import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../src/storage/settings';
import type { StorageLike } from '../../src/storage/progressStore';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('settings', () => {
  it('uses the defaults when nothing is saved or there is no storage', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('reads back what was saved', () => {
    const storage = memoryStorage();
    saveSettings(storage, { colorblind: true });
    expect(loadSettings(storage)).toEqual({ colorblind: true });
  });

  it('falls back to the default for a malformed value', () => {
    expect(loadSettings(memoryStorage({ 'dailyleague:settings': '{"colorblind":"yes"}' }))).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(loadSettings(memoryStorage({ 'dailyleague:settings': 'not json' }))).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('does not share a key with any mode’s progress', () => {
    const storage = memoryStorage();
    saveSettings(storage, { colorblind: true });
    expect(storage.getItem('dailyleague:v1:settings')).toBeNull();
  });

  it('ignores storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => {
      saveSettings(broken, { colorblind: true });
    }).not.toThrow();
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
  });
});
