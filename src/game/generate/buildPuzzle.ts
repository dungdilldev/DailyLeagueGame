import type { Question } from '../../data/questions';
import type { Champion, Entity, Item, StatSubject } from '../../data/schema';
import type { Puzzle, Round } from '../puzzle';
import { buildRound } from './buildRound';
import { fitsRound, MAX_PUZZLE_ATTEMPTS, ROUND_GAP_BANDS, type GapBand } from './config';
import { createRng, type Rng } from './random';

export interface PuzzleData {
  champions: readonly Champion[];
  items: readonly Item[];
}

/** The champions or items a question of this subject compares. */
export function entitiesFor(data: PuzzleData, subject: StatSubject): readonly Entity[] {
  return subject === 'item' ? data.items : data.champions;
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
    const fitting = remainingQuestions.filter((question) =>
      fitsRound(question.difficulty, roundIndex),
    );
    // Some questions cannot satisfy some bands (e.g. few distinct move speeds can't give a 30% gap).
    const round = firstSuccessful(fitting, (question) =>
      buildRound(
        entitiesFor(data, question.subject).filter((entity) => !usedIds.has(entity.id)),
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
 * harder in the order given by `bands`.
 */
export function buildPuzzle(
  date: string,
  data: PuzzleData,
  questions: readonly Question[],
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
): Puzzle {
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const rng = createRng(`${date}#${String(attempt)}`);
    const rounds = tryBuildRounds(data, questions, bands, rng);
    if (rounds) return { date, rounds };
  }
  throw new Error(
    `Could not build a puzzle for ${date} after ${String(MAX_PUZZLE_ATTEMPTS)} attempts`,
  );
}
