import type { PickQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

/**
 * Builds a round for a question with explicit right and wrong options: one answer from the
 * correct list and the rest from the wrong list. Difficulty bands do not apply, there are no
 * values to compare. `entities` are those still available (not used earlier in the day), and
 * ids in the lists that are not among them are skipped. Returns undefined if too few remain.
 */
export function buildPickRound(
  entities: readonly Entity[],
  question: PickQuestion,
  rng: Rng,
): Round | undefined {
  const excluded = new Set(question.exclude);
  const usable = (ids: readonly string[]) => {
    const wanted = new Set(ids);
    return entities.filter((entity) => wanted.has(entity.id) && !excluded.has(entity.id));
  };

  const answer = rng.shuffle(usable(question.correct))[0];
  const wrong = rng.shuffle(usable(question.wrong)).slice(0, OPTIONS_PER_ROUND - 1);
  if (!answer || wrong.length < OPTIONS_PER_ROUND - 1) return undefined;

  return {
    questionId: question.id,
    subject: question.subject,
    statLabel: question.label,
    question: question.question,
    optionIds: rng.shuffle([answer, ...wrong]).map((entity) => entity.id),
    answerId: answer.id,
    values: {},
  };
}
