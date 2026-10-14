import type { Snapshot } from '../data/schema';

/**
 * The snapshot a given puzzle day is generated from: the newest one already effective on `date`.
 * Falls back to the oldest if every snapshot is in the future (e.g. a device clock that is wrong).
 */
export function pickSnapshot(snapshots: readonly Snapshot[], date: string): Snapshot {
  // ISO dates compare correctly as plain strings.
  const sorted = [...snapshots].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const effective = sorted.filter((snapshot) => snapshot.effectiveFrom <= date);
  const chosen = effective.at(-1) ?? sorted[0];
  if (!chosen) throw new Error('No data snapshots available');
  return chosen;
}
