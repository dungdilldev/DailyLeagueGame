import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../../src/data/schema';
import { newestSnapshot, pickSnapshot } from '../../src/game/snapshot';

const snapshot = (patch: string, effectiveFrom: string): Snapshot<never> => ({
  patch,
  effectiveFrom,
  entities: [],
});

const OLD = snapshot('1.0', '2026-01-01');
const NEW = snapshot('1.1', '2026-02-01');

describe('pickSnapshot', () => {
  it('uses the newest snapshot that is already effective', () => {
    expect(pickSnapshot([OLD, NEW], '2026-02-01').patch).toBe('1.1');
    expect(pickSnapshot([OLD, NEW], '2026-03-15').patch).toBe('1.1');
  });

  it('keeps using the old snapshot until the new one takes effect', () => {
    expect(pickSnapshot([OLD, NEW], '2026-01-31').patch).toBe('1.0');
  });

  it('does not depend on the order of the list', () => {
    expect(pickSnapshot([NEW, OLD], '2026-01-15').patch).toBe('1.0');
  });

  it('falls back to the oldest snapshot when all are in the future', () => {
    expect(pickSnapshot([NEW, OLD], '2025-06-01').patch).toBe('1.0');
  });

  it('throws when there are no snapshots', () => {
    expect(() => pickSnapshot([], '2026-01-01')).toThrow();
  });
});

describe('newestSnapshot', () => {
  it('picks the latest snapshot even if it has not taken effect yet', () => {
    const early = snapshot('early', '2026-01-01');
    const late = snapshot('late', '2999-01-01');
    expect(newestSnapshot([late, early]).patch).toBe('late');
  });

  it('throws when there are no snapshots', () => {
    expect(() => newestSnapshot([])).toThrow();
  });
});
