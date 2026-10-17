import type { EndlessQuestion } from './endless';
import { ROUND_GAP_BANDS } from './generate/config';

/** What the endless mode has shown so far, to see at a glance whether everything is represented. */
export interface Coverage {
  /** Question id -> how many times the question was shown. */
  asked: Readonly<Record<string, number>>;
  /** Question id -> how many of those were answered correctly. */
  correct: Readonly<Record<string, number>>;
  /** Difficulty index -> how many questions were shown. */
  bands: readonly number[];
}

export function emptyCoverage(): Coverage {
  return { asked: {}, correct: {}, bands: ROUND_GAP_BANDS.map(() => 0) };
}

/** Returns the coverage with one more question shown. Does not modify its input. */
export function recordShown(coverage: Coverage, question: EndlessQuestion): Coverage {
  const { questionId } = question.round;
  return {
    ...coverage,
    asked: { ...coverage.asked, [questionId]: (coverage.asked[questionId] ?? 0) + 1 },
    bands: coverage.bands.map((count, index) => (index === question.bandIndex ? count + 1 : count)),
  };
}

/** Returns the coverage with the answer to a question counted. */
export function recordAnswer(
  coverage: Coverage,
  questionId: string,
  wasCorrect: boolean,
): Coverage {
  if (!wasCorrect) return coverage;
  return {
    ...coverage,
    correct: { ...coverage.correct, [questionId]: (coverage.correct[questionId] ?? 0) + 1 },
  };
}

/** Question ids that have not been shown yet. */
export function unseenQuestionIds(coverage: Coverage, questionIds: readonly string[]): string[] {
  return questionIds.filter((id) => (coverage.asked[id] ?? 0) === 0);
}
