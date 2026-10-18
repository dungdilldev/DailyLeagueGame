import type { Question } from '../data/questions';
import { QuestionCategorySchema, type QuestionCategory } from '../data/schema';

/** Names shown for question categories. */
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  stats: 'Stats',
  lore: 'Lore',
  esports: 'Esports',
};

/** The categories in display order, each with its questions; empty categories are left out. */
export function groupByCategory(
  questions: readonly Question[],
): { category: QuestionCategory; questions: Question[] }[] {
  return QuestionCategorySchema.options
    .map((category) => ({
      category,
      questions: questions.filter((question) => question.category === category),
    }))
    .filter((group) => group.questions.length > 0);
}
