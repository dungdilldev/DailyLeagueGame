import type { YearQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

const YEAR_PLACEHOLDER = '{year}';

/**
 * Builds a round that names one year and asks for that year's answer (the winner, the finalist,
 * the city...). The wrong options are answers of other years, so none of them can be argued to
 * be right. `entities` are the names still available; returns undefined if no year has its
 * answer and three other answers left.
 */
export function buildYearRound(
  entities: readonly Entity[],
  question: YearQuestion,
  rng: Rng,
): Round | undefined {
  const excluded = new Set(question.exclude);
  const available = new Set(entities.map(({ id }) => id).filter((id) => !excluded.has(id)));
  const allAnswers = [...new Set(question.byYear.map(({ answer }) => answer))];

  for (const { year, answer } of rng.shuffle(question.byYear)) {
    if (!available.has(answer)) continue;
    const others = allAnswers.filter((name) => name !== answer && available.has(name));
    const wrong = rng.shuffle(others).slice(0, OPTIONS_PER_ROUND - 1);
    if (wrong.length < OPTIONS_PER_ROUND - 1) continue;

    return {
      questionId: question.id,
      subject: question.subject,
      statLabel: question.label,
      question: question.question.replace(YEAR_PLACEHOLDER, String(year)),
      optionIds: rng.shuffle([answer, ...wrong]),
      answerId: answer,
      values: {},
    };
  }
  return undefined;
}
