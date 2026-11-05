import type { PuzzleDay } from '../game/puzzleDays';

/** The `<script type="application/json">` in which the build puts a game page's puzzles. */
export const PUZZLE_DAYS_ELEMENT_ID = 'puzzle-days';

/**
 * Set on `#app` by the page's inline script when the built-in markup is not what this player
 * should see (saved progress, or another day): the game stays hidden until the app has rendered.
 */
export const PENDING_CLASS = 'game__app--pending';

/**
 * The puzzles built into the page, or none if they are missing or unreadable (the app then says
 * so). Not checked against a schema: the same build that bundles this code wrote them.
 */
export function readPuzzleDays(document: Document): PuzzleDay[] {
  const element = document.getElementById(PUZZLE_DAYS_ELEMENT_ID);
  try {
    const parsed: unknown = JSON.parse(element?.textContent ?? '');
    return Array.isArray(parsed) ? (parsed as PuzzleDay[]) : [];
  } catch {
    return [];
  }
}
