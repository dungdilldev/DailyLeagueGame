import { describe, expect, it } from 'vitest';
import { parseQuestionFiles, QUESTION_FILES } from '../../src/data/questionFiles';
import { QuestionCategorySchema, type QuestionCategory } from '../../src/data/schema';

const entry = (id: string) => ({
  id,
  difficulty: 'variable',
  stat: 'hp',
  question: 'Which champion has the most health?',
});

/** One valid question per file (id = category), with some files replaced. */
const files = (overrides: Partial<Record<QuestionCategory, unknown[]>> = {}) =>
  Object.fromEntries(
    QuestionCategorySchema.options.map((category) => [
      category,
      { questions: overrides[category] ?? [entry(category)] },
    ]),
  ) as Record<QuestionCategory, unknown>;

describe('parseQuestionFiles', () => {
  it('gives each question the category of its file, in file order', () => {
    const questions = parseQuestionFiles(files());
    expect(questions.map(({ id, category }) => [id, category])).toEqual(
      QuestionCategorySchema.options.map((category) => [category, category]),
    );
  });

  it('rejects an entry that names its own category', () => {
    const named = { ...entry('lore'), category: 'lore' };
    expect(() => parseQuestionFiles(files({ lore: [named] }))).toThrow(
      /lore\.json[\s\S]*category comes from the file/,
    );
  });

  it('rejects an empty file', () => {
    expect(() => parseQuestionFiles(files({ lore: [] }))).toThrow(/lore\.json/);
  });

  it('names the file of an invalid entry', () => {
    const invalid = { ...entry('esports'), difficulty: 'impossible' };
    expect(() => parseQuestionFiles(files({ esports: [invalid] }))).toThrow(/esports\.json/);
  });

  it('rejects the same id in two files', () => {
    expect(() => parseQuestionFiles(files({ lore: [entry('stats')] }))).toThrow(/unique/);
  });

  it('accepts the real question files, with questions in every category', () => {
    const questions = parseQuestionFiles(QUESTION_FILES);
    for (const category of QuestionCategorySchema.options) {
      expect(questions.some((question) => question.category === category)).toBe(true);
    }
  });
});
