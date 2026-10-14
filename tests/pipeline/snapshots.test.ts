import { describe, expect, it } from 'vitest';
import type { Champion, Snapshot } from '../../src/data/schema';
import { mergeSnapshots, pruneSnapshots } from '../../pipeline/snapshots';

const champion = (id: string, hp: number): Champion => ({
  id,
  name: id,
  title: '',
  classes: [],
  iconUrl: `https://example.com/${id}.png`,
  stats: { hp },
});

const DATA_V1 = [champion('Ahri', 590)];
const DATA_V2 = [champion('Ahri', 600)];

const snapshot = (patch: string, effectiveFrom: string, champions = DATA_V1): Snapshot => ({
  patch,
  effectiveFrom,
  champions,
});

describe('mergeSnapshots', () => {
  it('makes the very first snapshot effective immediately', () => {
    expect(mergeSnapshots([], { patch: '1.0', champions: DATA_V1 }, '2026-03-05')).toEqual([
      snapshot('1.0', '2026-03-05'),
    ]);
  });

  it('changes nothing when the data is identical', () => {
    const existing = [snapshot('1.0', '2026-03-01')];
    expect(mergeSnapshots(existing, { patch: '1.0', champions: DATA_V1 }, '2026-03-05')).toEqual(
      existing,
    );
  });

  it('adds changed data as a snapshot that starts tomorrow, keeping today on the old one', () => {
    const existing = [snapshot('1.0', '2026-03-01')];
    const merged = mergeSnapshots(existing, { patch: '1.1', champions: DATA_V2 }, '2026-03-05');
    expect(merged).toEqual([snapshot('1.0', '2026-03-01'), snapshot('1.1', '2026-03-06', DATA_V2)]);
  });

  it('replaces an upcoming snapshot that has not taken effect yet', () => {
    const existing = [snapshot('1.0', '2026-03-01'), snapshot('1.1', '2026-03-06', DATA_V2)];
    const newer = [champion('Ahri', 610)];
    const merged = mergeSnapshots(existing, { patch: '1.2', champions: newer }, '2026-03-05');
    expect(merged.map((s) => s.patch)).toEqual(['1.0', '1.2']);
    expect(merged[1]?.effectiveFrom).toBe('2026-03-06');
  });

  it('keeps the snapshot players can still reach through the archive window', () => {
    const existing = [snapshot('1.0', '2026-03-01'), snapshot('1.1', '2026-03-06', DATA_V2)];
    const newer = [champion('Ahri', 610)];
    // Archive reaches back to 03-03, which was still on 1.0.
    const merged = mergeSnapshots(existing, { patch: '1.2', champions: newer }, '2026-03-10');
    expect(merged.map((s) => s.patch)).toEqual(['1.0', '1.1', '1.2']);
  });

  it('drops snapshots once the archive window has moved past them', () => {
    const existing = [snapshot('1.0', '2026-03-01'), snapshot('1.1', '2026-03-06', DATA_V2)];
    const newer = [champion('Ahri', 610)];
    const merged = mergeSnapshots(existing, { patch: '1.2', champions: newer }, '2026-03-20');
    expect(merged.map((s) => s.patch)).toEqual(['1.1', '1.2']);
  });
});

describe('pruneSnapshots', () => {
  it('keeps the current snapshot and everything after it', () => {
    const all = [
      snapshot('a', '2026-01-01'),
      snapshot('b', '2026-02-01'),
      snapshot('c', '2026-04-01'),
    ];
    expect(pruneSnapshots(all, '2026-03-01').map((s) => s.patch)).toEqual(['b', 'c']);
  });

  it('keeps everything when none is in effect yet', () => {
    const all = [snapshot('a', '2026-05-01')];
    expect(pruneSnapshots(all, '2026-03-01')).toEqual(all);
  });
});
