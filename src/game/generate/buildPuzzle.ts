import type { Question } from '../../data/questions';
import type { Ability, Champion, Item } from '../../data/schema';
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
  abilities: readonly Ability[];
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

/** Questions of the same category and subcategory share one slot; the others have a slot each. */
function slotKey(question: Question): string {
  return question.subcategory === undefined
    ? question.id
    : `${question.category}/${question.subcategory}`;
}

/** The slots of each category, categories and slots in the order they first appear. */
function slotsByCategory(questions: readonly Question[]): Question[][][] {
  const categories = new Map<string, Map<string, Question[]>>();
  for (const question of questions) {
    const slots = categories.get(question.category) ?? new Map<string, Question[]>();
    slots.set(slotKey(question), [...(slots.get(slotKey(question)) ?? []), question]);
    categories.set(question.category, slots);
  }
  return [...categories.values()].map((slots) => [...slots.values()]);
}

/** One item of each list in turn: [[a1, a2], [b1]] gives [a1, b1, a2]. */
function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const longest = Math.max(0, ...lists.map((list) => list.length));
  return Array.from({ length: longest }, (_, index) =>
    lists.flatMap((list) => list.slice(index, index + 1)),
  ).flat();
}

/**
 * The questions in the order they are tried: the categories take turns in random order, each
 * offering its slots in random order, and the questions of a slot come together in random order.
 * So every category gets about the same share of a mixed day, however many slots it has (stats
 * has a slot per stat), and a subcategory with many questions comes up as often as a single
 * question, instead of in proportion to its size. With one category this is a plain shuffle of
 * its slots (shuffling the one category draws no number), so the category modes are unaffected.
 */
function orderBySlot(questions: readonly Question[], rng: Rng): Question[] {
  const categories = rng.shuffle(slotsByCategory(questions));
  const slots = interleave(categories.map((slots) => rng.shuffle(slots)));
  return slots.flatMap((slot) => rng.shuffle(slot));
}

function tryBuildRounds(
  data: PuzzleData,
  questions: readonly Question[],
  bands: readonly GapBand[],
  rng: Rng,
): Round[] | undefined {
  const rounds: Round[] = [];
  // Ids cannot clash across subjects (names, numbers, name plus slot), so one set serves all.
  const usedIds = new Set<string>();
  let remainingQuestions = orderBySlot(questions, rng);

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
    // The whole slot is used up, so at most one question per subcategory is asked a day.
    const usedSlot = remainingQuestions.find(({ id }) => id === round.questionId);
    const usedKey = usedSlot && slotKey(usedSlot);
    remainingQuestions = remainingQuestions.filter((question) => slotKey(question) !== usedKey);
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
