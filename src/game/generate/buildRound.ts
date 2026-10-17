import type { Question } from '../../data/questions';
import type { Entity } from '../../data/schema';
import type { Round } from '../puzzle';
import type { GapBand } from './config';
import type { Rng } from './random';

interface Entry {
  entity: Entity;
  value: number;
}

/** Relative gap between a higher and a lower value, in [0, 1]. */
export function gapRatio(higher: number, lower: number): number {
  return (higher - lower) / higher;
}

function isWithinBand(ratio: number, band: GapBand): boolean {
  return ratio >= band.minRatio && ratio <= band.maxRatio;
}

/** Who may be the answer and who may be a wrong option, from the question's lists. */
function splitPools(entries: readonly Entry[], question: Question) {
  const excluded = new Set(question.exclude);
  const allowedAnswers = question.correct && new Set(question.correct);
  const allowedWrong = question.wrong && new Set(question.wrong);
  const usable = entries.filter((entry) => !excluded.has(entry.entity.id));
  return {
    answers: usable.filter((entry) => !allowedAnswers || allowedAnswers.has(entry.entity.id)),
    wrong: usable.filter((entry) => !allowedWrong || allowedWrong.has(entry.entity.id)),
  };
}

/**
 * Builds one round constructively instead of sampling and rejecting:
 * pick the answer, then a runner-up inside the difficulty band, then two clearly lower
 * options with distinct values. `entities` are the champions or items the question is about.
 * Returns undefined if this question cannot satisfy the band.
 */
export function buildRound(
  entities: readonly Entity[],
  question: Question,
  band: GapBand,
  rng: Rng,
): Round | undefined {
  const entries: Entry[] = entities.flatMap((entity) => {
    const value = entity.stats[question.statMeta.id];
    return value === undefined ? [] : [{ entity, value }];
  });
  const pools = splitPools(entries, question);

  for (const answer of rng.shuffle(pools.answers)) {
    const runnersUp = pools.wrong.filter(
      (entry) =>
        entry.value < answer.value && isWithinBand(gapRatio(answer.value, entry.value), band),
    );
    if (runnersUp.length === 0) continue;

    const runnerUp = rng.pick(runnersUp);
    const lower = rng.shuffle(pools.wrong.filter((entry) => entry.value < runnerUp.value));
    const third = lower[0];
    const fourth = lower.find((entry) => entry.value !== third?.value);
    if (!third || !fourth) continue;

    const chosen = rng.shuffle([answer, runnerUp, third, fourth]);
    return {
      questionId: question.id,
      subject: question.subject,
      statLabel: question.statMeta.label,
      question: question.question,
      format: question.statMeta.format,
      optionIds: chosen.map((entry) => entry.entity.id),
      answerId: answer.entity.id,
      values: Object.fromEntries(chosen.map((entry) => [entry.entity.id, entry.value])),
    };
  }
  return undefined;
}
