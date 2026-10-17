import { describe, expect, it } from 'vitest';
import { addUtcDays } from '../../../src/game/date';
import { buildPuzzle } from '../../../src/game/generate/buildPuzzle';
import type { QuestionDifficulty } from '../../../src/data/schema';
import {
  fitsRound,
  ROUND_GAP_BANDS,
  ROUND_TIERS,
  ROUNDS_PER_DAY,
} from '../../../src/game/generate/config';
import { findPuzzleProblems } from '../../support/findPuzzleProblems';
import { realGameData, realPuzzleData } from '../../support/realGameData';

// Uses the real published data, so this also guards against stat/band combinations that break.
// In CI the daily data job runs this suite before publishing, so new data can never go live if
// it cannot produce valid puzzles.
const data = realPuzzleData;
const { questions } = realGameData;
const everyone = [...data.champions, ...data.items];

describe('difficulty config', () => {
  it('names a tier for every round', () => {
    expect(ROUND_TIERS).toHaveLength(ROUND_GAP_BANDS.length);
  });

  it('lets a variable question into every round and a fixed one only into its tier', () => {
    ROUND_TIERS.forEach((tier, index) => {
      expect(fitsRound('variable', index)).toBe(true);
      expect(fitsRound(tier, index)).toBe(true);
      for (const other of ['easy', 'medium', 'hard'] as const) {
        expect(fitsRound(other, index), `${other} in round ${String(index + 1)}`).toBe(
          other === tier,
        );
      }
    });
  });

  it('gets strictly harder: bands move to smaller gaps each round', () => {
    for (let i = 1; i < ROUND_GAP_BANDS.length; i++) {
      const previous = ROUND_GAP_BANDS[i - 1];
      const current = ROUND_GAP_BANDS[i];
      expect(current?.maxRatio).toBeLessThanOrEqual(previous?.minRatio ?? 0);
    }
  });
});

describe('buildPuzzle', () => {
  it('is deterministic for the same date and data', () => {
    expect(buildPuzzle('2026-06-01', data, questions)).toEqual(
      buildPuzzle('2026-06-01', data, questions),
    );
  });

  it('differs between dates', () => {
    expect(buildPuzzle('2026-06-01', data, questions)).not.toEqual(
      buildPuzzle('2026-06-02', data, questions),
    );
  });

  it('produces a valid puzzle for a full year of dates', () => {
    for (let offset = 0; offset < 365; offset++) {
      const date = addUtcDays('2026-01-01', offset);
      const puzzle = buildPuzzle(date, data, questions);

      expect(puzzle.rounds, date).toHaveLength(ROUNDS_PER_DAY);
      expect(findPuzzleProblems(puzzle, everyone, questions), date).toEqual([]);
    }
  });
});

describe('buildPuzzle with champions and items', () => {
  const championIds = new Set(data.champions.map((champion) => champion.id));
  const itemIds = new Set(data.items.map((item) => item.id));
  const days = Array.from({ length: 365 }, (_, offset) => addUtcDays('2026-01-01', offset));
  const puzzles = days.map((date) => buildPuzzle(date, data, questions));

  it('uses champions for champion questions and items for item questions, never mixing them', () => {
    for (const puzzle of puzzles) {
      for (const round of puzzle.rounds) {
        const allowed = round.subject === 'item' ? itemIds : championIds;
        expect(
          round.optionIds.every((id) => allowed.has(id)),
          `${puzzle.date} ${round.questionId}`,
        ).toBe(true);
        expect(questions.find((question) => question.id === round.questionId)?.subject).toBe(
          round.subject,
        );
      }
    }
  });

  it('asks about both champions and items over time', () => {
    const subjects = new Set(
      puzzles.flatMap((puzzle) => puzzle.rounds.map((round) => round.subject)),
    );
    expect(subjects).toEqual(new Set(['champion', 'item']));
    const itemRounds = puzzles
      .flatMap((puzzle) => puzzle.rounds)
      .filter((round) => round.subject === 'item');
    expect(itemRounds.length).toBeGreaterThan(days.length / 2);
  });

  it('uses every item question at least once in a year', () => {
    const used = new Set(
      puzzles.flatMap((puzzle) => puzzle.rounds.map((round) => round.questionId)),
    );
    for (const question of questions) expect(used.has(question.id), question.id).toBe(true);
  });

  it('builds puzzles from champion questions only when there are no items', () => {
    const withoutItems = { champions: data.champions, items: [] };
    for (const date of days.slice(0, 60)) {
      const puzzle = buildPuzzle(date, withoutItems, questions);
      expect(puzzle.rounds.every((round) => round.subject === 'champion')).toBe(true);
      expect(findPuzzleProblems(puzzle, data.champions, questions), date).toEqual([]);
    }
  });
});

describe('buildPuzzle with answer lists', () => {
  const [first] = data.champions;
  const [second] = data.champions.slice(1);
  if (!first || !second) throw new Error('not enough champions');

  it('keeps every round valid and respects the lists of a question', () => {
    const restricted = questions.map((question) =>
      question.subject === 'champion'
        ? { ...question, correct: [first.id], exclude: [second.id] }
        : question,
    );
    for (let offset = 0; offset < 60; offset++) {
      const date = addUtcDays('2026-01-01', offset);
      const puzzle = buildPuzzle(date, data, restricted);
      expect(findPuzzleProblems(puzzle, everyone, restricted), date).toEqual([]);
      for (const round of puzzle.rounds.filter((r) => r.subject === 'champion')) {
        expect(round.answerId).toBe(first.id);
      }
    }
  });

  it('skips a question whose lists cannot produce a round, and asks others instead', () => {
    const impossible = questions.map((question, index) =>
      index === 0 ? { ...question, correct: ['NoSuchEntity'] } : question,
    );
    const puzzle = buildPuzzle('2026-06-01', data, impossible);
    expect(puzzle.rounds.some((round) => round.questionId === impossible[0]?.id)).toBe(false);
    expect(puzzle.rounds).toHaveLength(ROUNDS_PER_DAY);
  });
});

describe('buildPuzzle with question difficulty', () => {
  const [pick] = questions.filter((question) => question.kind === 'pick');
  if (!pick) throw new Error('no pick question in the data');
  const withDifficulty = (difficulty: QuestionDifficulty) =>
    questions.map((question) => (question.id === pick.id ? { ...question, difficulty } : question));
  const positionsOf = (difficulty: QuestionDifficulty) => {
    const found = new Set<number>();
    for (let offset = 0; offset < 200; offset++) {
      const puzzle = buildPuzzle(
        addUtcDays('2026-01-01', offset),
        data,
        withDifficulty(difficulty),
      );
      puzzle.rounds.forEach((round, index) => {
        if (round.questionId === pick.id) found.add(index);
      });
    }
    return [...found].sort();
  };

  it('only asks an easy question in the easy rounds, a hard one in the hard rounds', () => {
    expect(positionsOf('easy')).toEqual([0, 1]);
    expect(positionsOf('medium')).toEqual([2]);
    expect(positionsOf('hard')).toEqual([3, 4]);
  });

  it('asks a variable question in any round', () => {
    expect(positionsOf('variable')).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('findPuzzleProblems', () => {
  const puzzle = buildPuzzle('2026-06-01', data, questions);
  const tamper = (kind: 'stat' | 'pick') => {
    const index = puzzle.rounds.findIndex(
      (round) => questions.find(({ id }) => id === round.questionId)?.kind === kind,
    );
    const round = puzzle.rounds[index];
    if (!round) throw new Error(`no ${kind} round on this day`);
    const wrong = round.optionIds.find((id) => id !== round.answerId) ?? '';
    const rounds = puzzle.rounds.map((each, i) =>
      i === index ? { ...each, answerId: wrong } : each,
    );
    return findPuzzleProblems({ ...puzzle, rounds }, everyone, questions).join();
  };

  it('flags a tampered answer to a stat question', () => {
    expect(tamper('stat')).toContain('answer is not the highest');
  });

  it('flags a tampered answer to a pick question', () => {
    expect(tamper('pick')).toContain("answer is not in the question's correct list");
  });
});
