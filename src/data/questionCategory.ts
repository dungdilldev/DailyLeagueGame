/**
 * What kind of knowledge a question tests. Kept apart from the Zod schemas so the browser can use
 * it without loading Zod. The order sets how the question files are combined
 * (`questionFiles.ts`): changing it would change every mixed puzzle.
 */
export const QUESTION_CATEGORIES = ['stats', 'lore', 'esports', 'trivia'] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
