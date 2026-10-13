import type { Champion } from '../../src/data/schema';
import type { Round } from '../../src/data/puzzleSchema';
import type { StatDefinition } from '../stats/types';
import type { GapBand } from './config';
import type { Rng } from './random';

interface Entry {
  champion: Champion;
  value: number;
}

export type StatInfo = Pick<StatDefinition, 'id' | 'label'>;

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
 * champions with distinct values. Returns undefined if this stat cannot satisfy the band.
 */
export function buildRound(
  champions: readonly Champion[],
  stat: StatInfo,
  band: GapBand,
  rng: Rng,
): Round | undefined {
  const entries: Entry[] = champions.flatMap((champion) => {
    const value = champion.stats[stat.id]?.value;
    return value === undefined ? [] : [{ champion, value }];
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
      statLabel: stat.label,
      championIds: chosen.map((entry) => entry.champion.id),
      answerId: answer.champion.id,
      values: Object.fromEntries(chosen.map((entry) => [entry.champion.id, entry.value])),
    };
  }
  return undefined;
}
