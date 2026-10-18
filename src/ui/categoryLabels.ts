import type { Question } from '../data/questions';
import { QuestionCategorySchema, type QuestionCategory } from '../data/schema';

/** Names shown for question categories. */
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  stats: 'Stats',
  lore: 'Lore',
  esports: 'Esports',
};

/** "world-events" -> "World events". */
export function subcategoryLabel(subcategory: string): string {
  const words = subcategory.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface QuestionGroup {
  category: QuestionCategory;
  /** Absent for the questions of the category that have no subcategory. */
  subcategory?: string;
  /** Category, plus the subcategory if there is one. */
  label: string;
  questions: Question[];
}

/**
 * The questions grouped by category, and within a category by subcategory (questions without
 * one first). Categories and subcategories without questions are left out.
 */
export function groupQuestions(questions: readonly Question[]): QuestionGroup[] {
  return QuestionCategorySchema.options.flatMap((category) => {
    const inCategory = questions.filter((question) => question.category === category);
    const subcategories = [
      ...new Set(inCategory.flatMap(({ subcategory }) => (subcategory ? [subcategory] : []))),
    ].sort();
    const label = CATEGORY_LABELS[category];
    const groups: QuestionGroup[] = [
      {
        category,
        label,
        questions: inCategory.filter((question) => question.subcategory === undefined),
      },
      ...subcategories.map((subcategory) => ({
        category,
        subcategory,
        label: `${label} \u203a ${subcategoryLabel(subcategory)}`,
        questions: inCategory.filter((question) => question.subcategory === subcategory),
      })),
    ];
    return groups.filter((group) => group.questions.length > 0);
  });
}
