import type { Question } from '../../data/questions';
import type { Champion, Item } from '../../data/schema';
import type { Puzzle, Round } from '../puzzle';
import { buildRound } from './buildRound';
import { optionPool } from './optionPool';
import {
  fitsRound,
  MAX_PUZZLE_ATTEMPTS,
  ROUND_GAP_BANDS,
  tierDistance,
  type GapBand,
} from './config';
import { createRng, type Rng } from './random';

export interface PuzzleData {
  champions: readonly Champion[];
  items: readonly Item[];
}

function firstSuccessful<T, R>(
  items: readonly T[],
  attempt: (item: T) => R | undefined,
): R | undefined {
  for (const item of items) {
    const result = attempt(item);
    if (result !== undefined) return result;
  }
  return undefined;
}

/**
 * The questions a round may use, best first. Only questions that fit the round's tier, unless
 * none is left (a small pool, e.g. one category): then the nearest tiers, so the day is not cut
 * short just because the pool is lopsided.
 */
function candidatesForRound(remaining: readonly Question[], roundIndex: number): Question[] {
  const fitting = remaining.filter((question) => fitsRound(question.difficulty, roundIndex));
  if (fitting.length > 0) return fitting;
  return [...remaining].sort(
    (a, b) => tierDistance(a.difficulty, roundIndex) - tierDistance(b.difficulty, roundIndex),
  );
}

function tryBuildRounds(
  data: PuzzleData,
  questions: readonly Question[],
  bands: readonly GapBand[],
  rng: Rng,
): Round[] | undefined {
  const rounds: Round[] = [];
  // Ids of champions and items cannot clash (names vs. numbers), so one set serves both.
  const usedIds = new Set<string>();
  let remainingQuestions = rng.shuffle(questions);

  for (const [roundIndex, band] of bands.entries()) {
    // A pool with fewer questions than rounds gives a shorter day.
    if (remainingQuestions.length === 0) break;
    // Some questions cannot satisfy some bands (e.g. few distinct move speeds can't give a 30% gap).
    const round = firstSuccessful(candidatesForRound(remainingQuestions, roundIndex), (question) =>
      buildRound(
        optionPool(data, question).filter((entity) => !usedIds.has(entity.id)),
        question,
        band,
        rng,
      ),
    );
    if (!round) return undefined;

    rounds.push(round);
    round.optionIds.forEach((id) => usedIds.add(id));
    remainingQuestions = remainingQuestions.filter(({ id }) => id !== round.questionId);
  }
  return rounds;
}

/**
 * Builds the puzzle for one UTC day. Deterministic: the same date and data always give the
 * same puzzle. Each round uses a different question, nothing appears twice, and rounds get
 * harder in the order given by `bands`. `seed` defaults to the date; modes that play a subset
 * of the questions pass their own so their puzzles differ from the mixed one.
 */
export function buildPuzzle(
  date: string,
  data: PuzzleData,
  questions: readonly Question[],
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
  seed: string = date,
): Puzzle {
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const rng = createRng(`${seed}#${String(attempt)}`);
    const rounds = tryBuildRounds(data, questions, bands, rng);
    if (rounds) return { date, rounds };
  }
  throw new Error(
    `Could not build a puzzle for ${date} after ${String(MAX_PUZZLE_ATTEMPTS)} attempts`,
  );
}
