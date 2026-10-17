import type { Question } from '../data/questions';
import { buildRound } from './generate/buildRound';
import { entitiesFor, type PuzzleData } from './generate/buildPuzzle';
import { fitsRound, ROUND_GAP_BANDS } from './generate/config';
import { createRng } from './generate/random';
import type { Round } from './puzzle';

/** Restricts the endless mode to one question and/or one difficulty. */
export interface EndlessFilter {
  questionId?: string;
  /** Index into the daily difficulty bands: 0 is the easiest round, the last is the hardest. */
  bandIndex?: number;
}

export interface EndlessQuestion {
  round: Round;
  bandIndex: number;
}

/**
 * Builds one random question for the endless testing mode. Deterministic: the same seed, index
 * and filter always give the same question, so a problem can be reproduced from the seed.
 *
 * Without a filter the question is chosen uniformly among all questions, then a difficulty at
 * random; if that combination cannot be built (including a question whose difficulty does not
 * fit that round) (a stat with few distinct values cannot give a
 * big gap), other difficulties and then other questions are tried. With a filter that cannot be
 * satisfied the result is undefined, which is useful to see which questions cannot be asked
 * at which difficulty.
 */
export function buildEndlessQuestion(
  data: PuzzleData,
  questions: readonly Question[],
  seed: string,
  index: number,
  filter: EndlessFilter = {},
): EndlessQuestion | undefined {
  const rng = createRng(`${seed}#${String(index)}`);
  const candidates =
    filter.questionId === undefined
      ? rng.shuffle(questions)
      : questions.filter((question) => question.id === filter.questionId);
  const allBands = ROUND_GAP_BANDS.map((_, bandIndex) => bandIndex);

  for (const question of candidates) {
    const bands = filter.bandIndex === undefined ? rng.shuffle(allBands) : [filter.bandIndex];
    for (const bandIndex of bands) {
      const band = ROUND_GAP_BANDS[bandIndex];
      if (!band || !fitsRound(question.difficulty, bandIndex)) continue;
      const round = buildRound(entitiesFor(data, question.subject), question, band, rng);
      if (round) return { round, bandIndex };
    }
  }
  return undefined;
}
