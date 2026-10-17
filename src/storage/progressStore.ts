import { z } from 'zod';

const STORAGE_KEY = 'dailyleague:v1';

/** The mixed mode keeps the original key; every other mode saves apart, as its own game. */
function storageKey(slot: string | undefined): string {
  return slot === undefined ? STORAGE_KEY : `${STORAGE_KEY}:${slot}`;
}

const DayRecordSchema = z.object({
  /** Champion id chosen in each round, in order. */
  answers: z.array(z.string()),
  complete: z.boolean(),
  /** Set when the puzzle was played after its own day; such days do not count for the streak. */
  late: z.boolean().optional(),
});
export type DayRecord = z.infer<typeof DayRecordSchema>;

const SavedDaysSchema = z.record(z.string(), DayRecordSchema);
export type SavedDays = z.infer<typeof SavedDaysSchema>;

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
    const raw = storage?.getItem(storageKey(slot));
    if (!raw) return {};
    const parsed = SavedDaysSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
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
    storage?.setItem(storageKey(slot), JSON.stringify(days));
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
