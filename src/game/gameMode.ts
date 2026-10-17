import { QuestionCategorySchema, type QuestionCategory } from '../data/schema';
import type { Question } from '../data/questions';

/** The puzzle made from every question, whatever its category. */
export const MIXED_MODE = 'mixed';

/** What the player chooses to play: everything mixed, or the questions of one category. */
export type GameMode = typeof MIXED_MODE | QuestionCategory;

export const GAME_MODES: readonly GameMode[] = [MIXED_MODE, ...QuestionCategorySchema.options];

/** Anything that is not a known mode (garbage in the address bar) is the mixed mode. */
export function parseGameMode(value: string | null | undefined): GameMode {
  return GAME_MODES.find((mode) => mode === value) ?? MIXED_MODE;
}

export function questionsForMode(questions: readonly Question[], mode: GameMode): Question[] {
  return mode === MIXED_MODE
    ? [...questions]
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
