import type { Entity, StatMeta } from '../../data/schema';
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

/**
 * Builds one round constructively instead of sampling and rejecting:
 * pick the answer, then a runner-up inside the difficulty band, then two clearly lower
 * options with distinct values. `entities` are the champions or items the stat is about.
 * Returns undefined if this stat cannot satisfy the band.
 */
export function buildRound(
  entities: readonly Entity[],
  stat: StatMeta,
  band: GapBand,
  rng: Rng,
): Round | undefined {
  const entries: Entry[] = entities.flatMap((entity) => {
    const value = entity.stats[stat.id];
    return value === undefined ? [] : [{ entity, value }];
  });

  for (const answer of rng.shuffle(entries)) {
    const runnersUp = entries.filter(
      (entry) =>
        entry.value < answer.value && isWithinBand(gapRatio(answer.value, entry.value), band),
    );
    if (runnersUp.length === 0) continue;

    const runnerUp = rng.pick(runnersUp);
    const lower = rng.shuffle(entries.filter((entry) => entry.value < runnerUp.value));
    const third = lower[0];
    const fourth = lower.find((entry) => entry.value !== third?.value);
    if (!third || !fourth) continue;

    const chosen = rng.shuffle([answer, runnerUp, third, fourth]);
    return {
      statId: stat.id,
      subject: stat.subject,
      statLabel: stat.label,
      question: stat.question,
      format: stat.format,
      optionIds: chosen.map((entry) => entry.entity.id),
      answerId: answer.entity.id,
      values: Object.fromEntries(chosen.map((entry) => [entry.entity.id, entry.value])),
    };
  }
  return undefined;
}
