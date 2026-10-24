import type { SkinLineQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

const LINE_PLACEHOLDER = '{line}';

/**
 * Builds a round that names an esports skin line and offers one champion with a skin in it and
 * three without. `entities` are the champions still available; returns undefined if no line has
 * a champion and three others left (e.g. a snapshot from before skin lines were recorded).
 */
export function buildSkinLineRound(
  entities: readonly Entity[],
  question: SkinLineQuestion,
  rng: Rng,
): Round | undefined {
  const excluded = new Set(question.exclude);
  const usable = entities.filter(({ id }) => !excluded.has(id));
  const lines = [...new Set(usable.flatMap((entity) => entity.esportsSkinLines ?? []))].sort();
  const hasLine = (entity: Entity, line: string) =>
    entity.esportsSkinLines?.includes(line) ?? false;

  for (const line of rng.shuffle(lines)) {
    const answer = rng.shuffle(usable.filter((entity) => hasLine(entity, line)))[0];
    const wrong = rng
      .shuffle(usable.filter((entity) => !hasLine(entity, line)))
      .slice(0, OPTIONS_PER_ROUND - 1);
    if (!answer || wrong.length < OPTIONS_PER_ROUND - 1) continue;

    return {
      questionId: question.id,
      subject: question.subject,
      statLabel: question.label,
      question: question.question.replace(LINE_PLACEHOLDER, line),
      optionIds: rng.shuffle([answer, ...wrong].map(({ id }) => id)),
      answerId: answer.id,
      values: {},
    };
  }
  return undefined;
}
