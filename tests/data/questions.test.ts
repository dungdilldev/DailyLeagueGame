import { describe, expect, it } from 'vitest';
import questionFile from '../../data/questions.json';
import { resolveQuestions } from '../../src/data/questions';
import { QuestionFileSchema, type StatMeta } from '../../src/data/schema';
import { findQuestionListProblems } from '../../pipeline/validate/gameData';
import { realGameData } from '../support/realGameData';

const stat = (id: string): StatMeta => ({
  id,
  label: id,
  format: { kind: 'number' },
  source: 'test',
});
const stats = { champion: [stat('hp')], item: [stat('cost')] };

const template = { id: 'q', stat: 'hp', question: 'Which champion has the most health?' };
const parse = (questions: unknown[]) => QuestionFileSchema.safeParse({ questions });

describe('QuestionFileSchema', () => {
  it('accepts a plain question and one with all three lists', () => {
    expect(parse([template]).success).toBe(true);
    const lists = { correct: ['A'], wrong: ['B', 'C'], exclude: ['D'] };
    expect(parse([{ ...template, ...lists }]).success).toBe(true);
  });

  it('rejects an id that is in two lists, since its role would be ambiguous', () => {
    expect(parse([{ ...template, correct: ['A'], wrong: ['A'] }]).success).toBe(false);
    expect(parse([{ ...template, wrong: ['A'], exclude: ['A'] }]).success).toBe(false);
  });

  it('rejects an empty list, which would silently make the question impossible', () => {
    expect(parse([{ ...template, correct: [] }]).success).toBe(false);
  });

  it('rejects duplicate question ids and an empty file', () => {
    expect(parse([template, template]).success).toBe(false);
    expect(parse([]).success).toBe(false);
  });
});

describe('resolveQuestions', () => {
  it('finds out from the stat whether a question is about champions or items', () => {
    const [champion, item] = resolveQuestions(
      [template, { ...template, id: 'i', stat: 'cost' }],
      stats,
    );
    expect(champion?.subject).toBe('champion');
    expect(item?.subject).toBe('item');
    expect(item?.statMeta.id).toBe('cost');
  });

  it('keeps the lists', () => {
    const [question] = resolveQuestions([{ ...template, exclude: ['A'] }], stats);
    expect(question?.exclude).toEqual(['A']);
  });

  it('fails loudly for an unknown stat', () => {
    expect(() => resolveQuestions([{ ...template, stat: 'nope' }], stats)).toThrow(
      'Question "q" uses unknown stat "nope"',
    );
  });
});

describe('the question file in the repository', () => {
  const { questions } = realGameData;

  it('is valid', () => {
    expect(QuestionFileSchema.safeParse(questionFile).success).toBe(true);
  });

  it('asks about champions or items matching the data the stat comes from', () => {
    for (const question of questions) {
      const noun = question.subject === 'item' ? 'item' : 'champion';
      expect(question.question, question.id).toMatch(new RegExp(`^Which ${noun} .*[?]$`));
    }
  });

  it('only names champions and items that exist in the current data', () => {
    const known = {
      champion: new Set(
        realGameData.champions.snapshots.flatMap((s) => s.entities.map((e) => e.id)),
      ),
      item: new Set(realGameData.items.snapshots.flatMap((s) => s.entities.map((e) => e.id))),
    };
    expect(findQuestionListProblems(questions, known)).toEqual([]);
  });
});
