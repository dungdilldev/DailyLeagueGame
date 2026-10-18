import { describe, expect, it } from 'vitest';
import questionFile from '../../data/questions.json';
import { resolveQuestions, type PickQuestion } from '../../src/data/questions';
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

const template = {
  id: 'q',
  category: 'stats' as const,
  difficulty: 'variable' as const,
  stat: 'hp',
  question: 'Which champion has the most health?',
};
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

const pick = {
  id: 'marksman',
  category: 'lore' as const,
  difficulty: 'easy' as const,
  subject: 'champion' as const,
  label: 'Marksmen',
  question: 'Which of these champions is a marksman?',
  correct: ['Jinx', 'Ashe'],
  wrong: ['Garen', 'Lux', 'Zed'],
};

describe('category and difficulty', () => {
  it('are required, so every question is classified', () => {
    expect(parse([{ ...template, category: undefined }]).success).toBe(false);
    expect(parse([{ ...template, difficulty: undefined }]).success).toBe(false);
  });

  it('accept every difficulty and both categories', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'variable']) {
      expect(parse([{ ...template, difficulty }]).success, difficulty).toBe(true);
    }
    for (const category of ['stats', 'lore', 'esports']) {
      expect(parse([{ ...template, category }]).success, category).toBe(true);
    }
  });

  it('reject anything else', () => {
    expect(parse([{ ...template, difficulty: 'impossible' }]).success).toBe(false);
    expect(parse([{ ...template, category: 'sport' }]).success).toBe(false);
  });
});

describe('pick questions', () => {
  it('are accepted with a subject, a label and both lists', () => {
    expect(parse([pick]).success).toBe(true);
    expect(parse([pick, template]).success).toBe(true);
  });

  it('need both lists in full, with at least 3 wrong options', () => {
    expect(parse([{ ...pick, wrong: ['Garen', 'Lux'] }]).success).toBe(false);
    expect(parse([{ ...pick, correct: undefined }]).success).toBe(false);
    expect(parse([{ ...pick, wrong: undefined }]).success).toBe(false);
  });

  it('need a subject, since there is no stat to tell champions from items', () => {
    expect(parse([{ ...pick, subject: undefined }]).success).toBe(false);
  });

  it('cannot reuse an id across the two lists', () => {
    expect(parse([{ ...pick, wrong: ['Jinx', 'Lux', 'Zed'] }]).success).toBe(false);
  });

  it('reject unknown fields, so a typo like "corect" is not silently ignored', () => {
    expect(parse([{ ...pick, corect: ['Jinx'] }]).success).toBe(false);
    expect(parse([{ ...template, corect: ['A'] }]).success).toBe(false);
  });

  it('resolve without a stat', () => {
    const [question] = resolveQuestions([pick], stats, []);
    expect(question?.kind).toBe('pick');
    expect(question?.subject).toBe('champion');
  });
});

const clue = {
  id: 'knownAsTitle',
  category: 'lore' as const,
  difficulty: 'easy' as const,
  subject: 'champion' as const,
  clue: 'title' as const,
  label: 'Champion titles',
  question: 'Which champion is known as "{title}"?',
};

describe('clue questions', () => {
  it('are accepted with a subject, a clue, a label and the question text', () => {
    expect(parse([clue]).success).toBe(true);
    expect(parse([clue, template, pick]).success).toBe(true);
  });

  it('only quote a clue we can read from the champion data, about champions', () => {
    expect(parse([{ ...clue, clue: 'region' }]).success).toBe(false);
    expect(parse([{ ...clue, subject: 'item' }]).success).toBe(false);
    expect(parse([{ ...clue, subject: undefined }]).success).toBe(false);
  });

  it('need a label, and reject answer lists, which they do not use', () => {
    expect(parse([{ ...clue, label: undefined }]).success).toBe(false);
    expect(parse([{ ...clue, correct: ['Ahri'] }]).success).toBe(false);
  });

  it('can exclude champions', () => {
    expect(parse([{ ...clue, exclude: ['Teemo'] }]).success).toBe(true);
  });

  it('resolve without a stat', () => {
    const [question] = resolveQuestions([clue], stats, []);
    expect(question?.kind).toBe('clue');
  });
});

const playerQuestion = {
  id: 'playerByTeam',
  category: 'esports' as const,
  difficulty: 'medium' as const,
  subject: 'text' as const,
  label: 'Players and teams',
  ask: 'playerByTeam' as const,
  question: 'Which of these players has played for {team}?',
};

describe('player questions', () => {
  it('are accepted for either direction and for text options only', () => {
    expect(parse([playerQuestion]).success).toBe(true);
    expect(parse([{ ...playerQuestion, ask: 'teamByPlayer' }]).success).toBe(true);
    expect(parse([{ ...playerQuestion, subject: 'champion' }]).success).toBe(false);
    expect(parse([{ ...playerQuestion, ask: 'other' }]).success).toBe(false);
  });

  it('reject answer lists, which they do not use', () => {
    expect(parse([{ ...playerQuestion, correct: ['Faker'] }]).success).toBe(false);
  });

  it('resolve with the players they are built from', () => {
    const players = [{ name: 'Faker', region: 'Korea' as const, titles: [], teams: ['T1'] }];
    const [question] = resolveQuestions([playerQuestion], stats, players);
    expect(question?.kind === 'player' && question.players).toEqual(players);
  });
});

const winner = {
  id: 'worldsWinnerByYear',
  category: 'esports' as const,
  difficulty: 'medium' as const,
  subject: 'text' as const,
  label: 'Worlds winners',
  question: 'Which team won Worlds in {year}?',
  winners: [
    { year: 2011, team: 'Fnatic' },
    { year: 2012, team: 'Taipei Assassins' },
    { year: 2013, team: 'T1' },
    { year: 2014, team: 'Samsung White' },
  ],
};

describe('subcategory', () => {
  it('is optional and allowed on every kind of question', () => {
    expect(parse([{ ...template, subcategory: 'geography' }]).success).toBe(true);
    expect(parse([{ ...pick, subcategory: 'world-events' }]).success).toBe(true);
    expect(parse([template, pick]).success).toBe(true);
  });

  it('must be lowercase words joined by hyphens, so a typo does not make a new group', () => {
    for (const subcategory of ['Geography', 'geo graphy', 'geography_', '', '-geography']) {
      expect(parse([{ ...template, subcategory }]).success, subcategory).toBe(false);
    }
  });
});

describe('winner questions', () => {
  it('are accepted with a year placeholder and winners', () => {
    expect(parse([winner]).success).toBe(true);
  });

  it('need the year placeholder, or every round would ask the same thing', () => {
    expect(parse([{ ...winner, question: 'Which team won Worlds?' }]).success).toBe(false);
  });

  it('need one winner per year and at least four different teams for the wrong options', () => {
    const twice = [...winner.winners, { year: 2011, team: 'Cloud9' }];
    expect(parse([{ ...winner, winners: twice }]).success).toBe(false);
    expect(parse([{ ...winner, winners: winner.winners.slice(0, 3) }]).success).toBe(false);
  });

  it('resolve without extra data', () => {
    const [question] = resolveQuestions([winner], stats, []);
    expect(question?.kind).toBe('winner');
  });
});

describe('resolveQuestions', () => {
  it('finds out from the stat whether a question is about champions or items', () => {
    const [champion, item] = resolveQuestions(
      [template, { ...template, id: 'i', stat: 'cost' }],
      stats,
      [],
    );
    expect(champion?.subject).toBe('champion');
    expect(item?.subject).toBe('item');
    expect(item?.kind === 'stat' && item.statMeta.id).toBe('cost');
  });

  it('keeps the lists', () => {
    const [question] = resolveQuestions([{ ...template, exclude: ['A'] }], stats, []);
    expect(question?.exclude).toEqual(['A']);
  });

  it('fails loudly for an unknown stat', () => {
    expect(() => resolveQuestions([{ ...template, stat: 'nope' }], stats, [])).toThrow(
      'Question "q" uses unknown stat "nope"',
    );
  });
});

describe('the question file in the repository', () => {
  const { questions } = realGameData;

  it('puts stat questions in "stats" and "variable", and every other kind elsewhere', () => {
    for (const question of questions) {
      if (question.kind !== 'stat') expect(question.category, question.id).not.toBe('stats');
      else
        expect([question.category, question.difficulty], question.id).toEqual([
          'stats',
          'variable',
        ]);
    }
  });

  it('has esports questions, and no wrong option of one has an esports skin of its own', () => {
    const esports = questions.filter((question) => question.category === 'esports');
    expect(esports.length).toBeGreaterThan(0);
    const skinQuestions = esports.filter(
      (question): question is PickQuestion =>
        question.kind === 'pick' && question.subject === 'champion',
    );
    const correctElsewhere = new Set(skinQuestions.flatMap((question) => question.correct));
    for (const question of skinQuestions) {
      expect(
        question.wrong.some((id) => correctElsewhere.has(id)),
        question.id,
      ).toBe(false);
    }
  });

  it('has lore questions about the world of League of Legends', () => {
    const lore = questions.filter((question) => question.category === 'lore');
    expect(lore.length).toBeGreaterThan(0);
    expect(lore.every((question) => question.kind !== 'stat')).toBe(true);
  });

  it('is valid', () => {
    expect(QuestionFileSchema.safeParse(questionFile).success).toBe(true);
  });

  it('asks about champions or items matching the data the stat comes from', () => {
    for (const question of questions) {
      const noun = question.subject === 'item' ? 'item' : 'champion';
      // Text options can be anything (teams, players, cities), so only the opening is fixed.
      const pattern =
        question.subject === 'text'
          ? /^Which .*[?]$/
          : question.kind === 'pick'
            ? new RegExp(`^Which of these ${noun}s .*[?]$`)
            : new RegExp(`^Which ${noun} .*[?]$`);
      expect(question.question, question.id).toMatch(pattern);
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
