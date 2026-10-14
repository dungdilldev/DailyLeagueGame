import type { Snapshot } from '../src/data/schema';
import { earliestPlayableDate } from '../src/game/archive';
import { addUtcDays } from '../src/game/date';

type FreshData = Pick<Snapshot, 'patch' | 'champions' | 'items'>;

/**
 * Keeps what players can still reach: the snapshot that was in effect on the earliest playable
 * archive day, and everything after it. Older snapshots are never used again.
 */
export function pruneSnapshots(snapshots: readonly Snapshot[], today: string): Snapshot[] {
  const earliest = earliestPlayableDate(today);
  const firstNeeded = snapshots.findLastIndex((snapshot) => snapshot.effectiveFrom <= earliest);
  return firstNeeded <= 0 ? [...snapshots] : snapshots.slice(firstNeeded);
}

function hasSameContent(a: FreshData, b: FreshData): boolean {
  return (
    JSON.stringify({ champions: a.champions, items: a.items }) ===
    JSON.stringify({ champions: b.champions, items: b.items })
  );
}

/**
 * Folds freshly fetched data into the published snapshots.
 *
 * - Identical data changes nothing.
 * - Different data becomes a new snapshot that takes effect tomorrow (UTC), so the puzzle of a
 *   day already in progress never changes. If an upcoming snapshot has not taken effect yet, it
 *   is replaced: nobody has played from it.
 * - The very first snapshot is effective immediately.
 */
export function mergeSnapshots(
  existing: readonly Snapshot[],
  fresh: FreshData,
  today: string,
): Snapshot[] {
  const sorted = [...existing].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const latest = sorted.at(-1);
  if (!latest) return [{ ...fresh, effectiveFrom: today }];

  if (hasSameContent(latest, fresh)) {
    return pruneSnapshots(sorted, today);
  }

  const upcomingIsUnused = latest.effectiveFrom > today;
  const kept = upcomingIsUnused ? sorted.slice(0, -1) : sorted;
  return pruneSnapshots([...kept, { ...fresh, effectiveFrom: addUtcDays(today, 1) }], today);
}
