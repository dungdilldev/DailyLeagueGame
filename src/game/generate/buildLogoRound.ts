import type { LogoQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

/**
 * Builds a round that shows one team's logo and offers that team plus three others from the
 * question's list. `entities` are the team names still available; returns undefined if fewer
 * than four are left.
 */
export function buildLogoRound(
  entities: readonly Entity[],
  question: LogoQuestion,
  rng: Rng,
): Round | undefined {
  const excluded = new Set(question.exclude);
  const teams = rng.shuffle(entities.map(({ id }) => id).filter((id) => !excluded.has(id)));
  const [answer, ...others] = teams;
  const wrong = others.slice(0, OPTIONS_PER_ROUND - 1);
  if (answer === undefined || wrong.length < OPTIONS_PER_ROUND - 1) return undefined;

  return {
    questionId: question.id,
    subject: question.subject,
    statLabel: question.label,
    question: question.question,
    clue: 'teamLogo',
    optionIds: rng.shuffle([answer, ...wrong]),
    answerId: answer,
    values: {},
  };
}
