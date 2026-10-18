import type { WinnerQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

const YEAR_PLACEHOLDER = '{year}';

/**
 * Builds a round that names one year of a tournament and asks which team won it. The wrong
 * options are teams that won the same tournament in other years, so none of them can be argued
 * to be right. `entities` are the team names still available; returns undefined if no year has
 * a winner and three other winning teams left.
 */
export function buildWinnerRound(
  entities: readonly Entity[],
  question: WinnerQuestion,
  rng: Rng,
): Round | undefined {
  const excluded = new Set(question.exclude);
  const available = new Set(entities.map(({ id }) => id).filter((id) => !excluded.has(id)));

  for (const { year, team } of rng.shuffle(question.winners)) {
    if (!available.has(team)) continue;
    const others = [...new Set(question.winners.map((winner) => winner.team))].filter(
      (name) => name !== team && available.has(name),
    );
    const wrong = rng.shuffle(others).slice(0, OPTIONS_PER_ROUND - 1);
    if (wrong.length < OPTIONS_PER_ROUND - 1) continue;

    return {
      questionId: question.id,
      subject: question.subject,
      statLabel: question.label,
      question: question.question.replace(YEAR_PLACEHOLDER, String(year)),
      optionIds: rng.shuffle([team, ...wrong]),
      answerId: team,
      values: {},
    };
  }
  return undefined;
}
