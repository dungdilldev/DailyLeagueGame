const STORAGE_KEY = 'dailyleague:v1';

/**
 * The mixed mode keeps the original key; every other mode saves apart, as its own game. Also read
 * by the small script each game page carries (see `src/prerender`), before the app has loaded.
 */
export function progressStorageKey(slot: string | undefined): string {
  return slot === undefined ? STORAGE_KEY : `${STORAGE_KEY}:${slot}`;
}

export interface DayRecord {
  /** Champion id chosen in each round, in order. */
  answers: string[];
  complete: boolean;
  /**
   * Set on days played after their own day, back when earlier days could be played (until
   * 2026-11-05). No longer written, but such saved days still do not count for the streak.
   */
  late?: boolean;
}

export type SavedDays = Record<string, DayRecord>;

// Checked by hand rather than with Zod: this module runs on every page, and Zod would be most of
// the JavaScript the start page loads.

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** The saved day without any unknown fields, or undefined if it has the wrong shape. */
function readDayRecord(value: unknown): DayRecord | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { answers, complete, late } = value as Record<string, unknown>;
  if (!isStringArray(answers) || typeof complete !== 'boolean') return undefined;
  if (late === undefined) return { answers, complete };
  return typeof late === 'boolean' ? { answers, complete, late } : undefined;
}

/** All saved days, or undefined if anything is malformed (the stored progress is then ignored). */
function readSavedDays(value: unknown): SavedDays | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const entries = Object.entries(value).map(([date, day]) => [date, readDayRecord(day)] as const);
  const valid = entries.flatMap(([date, record]) => (record ? [[date, record] as const] : []));
  // fromEntries rather than assignment, so a "__proto__" key stays a plain key.
  return valid.length === entries.length ? Object.fromEntries(valid) : undefined;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** localStorage can be missing or throw (private windows, blocked site data); the game must still work. */
export function getBrowserStorage(): StorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Returns saved progress, or an empty record if nothing usable is stored. Never throws. */
export function loadSavedDays(storage: StorageLike | undefined, slot?: string): SavedDays {
  try {
    const raw = storage?.getItem(progressStorageKey(slot));
    if (!raw) return {};
    return readSavedDays(JSON.parse(raw)) ?? {};
  } catch {
    return {};
  }
}

/** Saves one day's progress, keeping the other days. Failures are ignored: progress is a convenience. */
export function saveDay(
  storage: StorageLike | undefined,
  date: string,
  record: DayRecord,
  slot?: string,
): void {
  try {
    const days = { ...loadSavedDays(storage, slot), [date]: record };
    storage?.setItem(progressStorageKey(slot), JSON.stringify(days));
  } catch {
    // Storage full or blocked: keep playing with in-memory state.
  }
}

/** Days completed on their own day; these are the ones that count for the streak. */
export function completedDates(days: SavedDays): string[] {
  return Object.entries(days)
    .filter(([, record]) => record.complete && !record.late)
    .map(([date]) => date);
}
