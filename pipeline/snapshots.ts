import type { Snapshot } from '../src/data/schema';
import { earliestPlayableDate } from '../src/game/archive';
import { addUtcDays } from '../src/game/date';

type FreshData<T> = Pick<Snapshot<T>, 'patch' | 'entities'>;

/**
 * Keeps what players can still reach: the snapshot that was in effect on the earliest playable
 * archive day, and everything after it. Older snapshots are never used again.
 */
export function pruneSnapshots<T>(snapshots: readonly Snapshot<T>[], today: string): Snapshot<T>[] {
  const earliest = earliestPlayableDate(today);
  const firstNeeded = snapshots.findLastIndex((snapshot) => snapshot.effectiveFrom <= earliest);
  return firstNeeded <= 0 ? [...snapshots] : snapshots.slice(firstNeeded);
}

function hasSameContent<T>(a: FreshData<T>, b: FreshData<T>): boolean {
  return JSON.stringify(a.entities) === JSON.stringify(b.entities);
}

/**
 * Folds freshly fetched data into the published snapshots of one data file (champions or items
 * each have their own).
 *
 * - Identical data changes nothing.
 * - Different data becomes a new snapshot that takes effect tomorrow (UTC), so the puzzle of a
 *   day already in progress never changes. If an upcoming snapshot has not taken effect yet, it
 *   is replaced: nobody has played from it.
 * - The very first snapshot is effective immediately.
 */
export function mergeSnapshots<T>(
  existing: readonly Snapshot<T>[],
  fresh: FreshData<T>,
  today: string,
): Snapshot<T>[] {
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
