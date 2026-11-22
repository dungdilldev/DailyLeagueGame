import type { QuestionCategory } from '../data/schema';
import type { Question } from '../data/questions';

/** The puzzle made from every question, whatever its category. */
export const MIXED_MODE = 'mixed';

/** What the player chooses to play: everything mixed, or the questions of one category. */
export type GameMode = typeof MIXED_MODE | QuestionCategory;

/**
 * Categories that are not played for now: no mode, no page, and left out of the mixed puzzle.
 * Their questions stay in the files and in the dev-only endless mode, so showing one again is
 * removing it here and restoring its page. Esports is hidden because its questions do not work
 * well yet (owner, 2026-11-22).
 */
export const HIDDEN_CATEGORIES: readonly QuestionCategory[] = ['esports'];

function isHidden(mode: GameMode): boolean {
  return (HIDDEN_CATEGORIES as readonly GameMode[]).includes(mode);
}

/**
 * Every mode, in the order the mode links show them and "Play X next" suggests them. Written out
 * rather than taken from `QUESTION_CATEGORIES`, whose order sets how the question files are
 * combined: reordering that would change every mixed puzzle.
 */
const MODE_ORDER: readonly GameMode[] = ['trivia', 'lore', 'stats', 'esports', MIXED_MODE];

/** The modes that can be played, in display order. */
export const GAME_MODES: readonly GameMode[] = MODE_ORDER.filter((mode) => !isHidden(mode));

/** The mode the site opens in when the address names none. */
export const DEFAULT_GAME_MODE: GameMode = 'trivia';

/** Anything that is not a known mode (garbage in the address bar) is the default mode. */
export function parseGameMode(value: string | null | undefined): GameMode {
  return GAME_MODES.find((mode) => mode === value) ?? DEFAULT_GAME_MODE;
}

export function questionsForMode(questions: readonly Question[], mode: GameMode): Question[] {
  return mode === MIXED_MODE
    ? questions.filter((question) => !isHidden(question.category))
    : questions.filter((question) => question.category === mode);
}

/**
 * Seed text for a day's puzzle. The mixed mode keeps the plain date, so it is the same puzzle
 * as before modes existed; each category gets its own sequence.
 */
export function puzzleSeed(date: string, mode: GameMode): string {
  return mode === MIXED_MODE ? date : `${date}:${mode}`;
}

/** Where a mode's progress is saved apart from the mixed mode, which keeps the original slot. */
export function progressSlot(mode: GameMode): string | undefined {
  return mode === MIXED_MODE ? undefined : mode;
}

/**
 * The mode to suggest after finishing `current`: the next one in `GAME_MODES` order (wrapping
 * round) that is not in `finished`. Undefined once every other mode is finished too.
 */
export function nextUnfinishedMode(
  current: GameMode,
  finished: readonly GameMode[],
): GameMode | undefined {
  const start = GAME_MODES.indexOf(current);
  const later = [...GAME_MODES.slice(start + 1), ...GAME_MODES.slice(0, start)];
  return later.find((mode) => !finished.includes(mode));
}
