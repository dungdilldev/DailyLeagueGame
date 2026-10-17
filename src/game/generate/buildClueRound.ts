import type { ClueQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

const TITLE_PLACEHOLDER = '{title}';

/**
 * Builds a round that quotes a clue about one champion: that champion is the answer and three
 * random others are the wrong options. Champions without a title cannot be the answer.
 * Returns undefined if too few champions are available.
 */
export function buildClueRound(
  champions: readonly Entity[],
  question: ClueQuestion,
  rng: Rng,
): Round | undefined {
  const excluded = new Set(question.exclude);
  const usable = rng.shuffle(champions.filter((champion) => !excluded.has(champion.id)));
  const answer = usable.find((champion) => champion.title !== undefined);
  if (!answer?.title || usable.length < OPTIONS_PER_ROUND) return undefined;

  const wrong = usable.filter((champion) => champion !== answer).slice(0, OPTIONS_PER_ROUND - 1);
  return {
    questionId: question.id,
    subject: question.subject,
    statLabel: question.label,
    question: question.question.replace(TITLE_PLACEHOLDER, answer.title),
    optionIds: rng.shuffle([answer, ...wrong]).map((champion) => champion.id),
    answerId: answer.id,
    values: {},
  };
}
