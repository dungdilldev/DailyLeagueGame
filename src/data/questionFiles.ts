import { z } from 'zod';
import esportsQuestions from '../../data/questions/esports.json';
import loreQuestions from '../../data/questions/lore.json';
import statsQuestions from '../../data/questions/stats.json';
import triviaQuestions from '../../data/questions/trivia.json';
import {
  CategoryQuestionFileSchema,
  QuestionCategorySchema,
  QuestionFileSchema,
  type QuestionCategory,
  type QuestionTemplate,
} from './schema';

/** The raw content of each category's question file. */
export type QuestionSources = Record<QuestionCategory, unknown>;

/** The hand-written question files, one per category: the file a question is in is its category. */
export const QUESTION_FILES: QuestionSources = {
  stats: statsQuestions,
  lore: loreQuestions,
  esports: esportsQuestions,
  trivia: triviaQuestions,
};

/** Throws with the file's name, so a bad entry is easy to find. */
function parseOrThrow<T>(schema: z.ZodType<T>, source: unknown, category: QuestionCategory): T {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  throw new Error(`Invalid data/questions/${category}.json:\n${z.prettifyError(result.error)}`);
}

function parseCategoryFile(source: unknown, category: QuestionCategory): QuestionTemplate[] {
  const { questions } = parseOrThrow(CategoryQuestionFileSchema, source, category);
  const withCategory = { questions: questions.map((entry) => ({ ...entry, category })) };
  return parseOrThrow(QuestionFileSchema, withCategory, category).questions;
}

/**
 * Validates every question file, gives each question the category of its file, and checks that
 * ids are unique across files. Questions keep the order of the files and of their entries.
 */
export function parseQuestionFiles(sources: QuestionSources): QuestionTemplate[] {
  const questions = QuestionCategorySchema.options.flatMap((category) =>
    parseCategoryFile(sources[category], category),
  );
  return QuestionFileSchema.parse({ questions }).questions;
}
