import type { Entity } from '../../src/data/schema';
import { gapRatio } from '../../src/game/generate/buildRound';
import { ROUND_GAP_BANDS, type GapBand } from '../../src/game/generate/config';
import type { Puzzle } from '../../src/game/puzzle';

/**
 * Independent re-check of a generated puzzle against the champion and item data it came from.
 * Deliberately shares no logic with the generator beyond the gap formula. Empty result = valid.
 */
export function findPuzzleProblems(
  puzzle: Puzzle,
  entities: readonly Entity[],
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
): string[] {
  const problems: string[] = [];
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const seenChampions = new Set<string>();
  const seenStats = new Set<string>();

  if (puzzle.rounds.length !== bands.length) {
    problems.push(`Expected ${String(bands.length)} rounds, got ${String(puzzle.rounds.length)}`);
  }

  puzzle.rounds.forEach((round, index) => {
    const label = `Round ${String(index + 1)}`;

    if (seenStats.has(round.statId)) problems.push(`${label}: stat "${round.statId}" repeated`);
    seenStats.add(round.statId);

    if (round.optionIds.length !== 4) problems.push(`${label}: not 4 options`);

    const values: number[] = [];
    for (const id of round.optionIds) {
      const stored = entitiesById.get(id)?.stats[round.statId];
      if (stored === undefined) {
        problems.push(`${label}: unknown option or stat for "${id}"`);
        continue;
      }
      if (round.values[id] !== stored) {
        problems.push(`${label}: value for "${id}" does not match data`);
      }
      if (seenChampions.has(id)) {
        problems.push(`${label}: "${id}" appears twice in the day`);
      }
      seenChampions.add(id);
      values.push(stored);
    }

    const sorted = [...values].sort((a, b) => b - a);
    const [best, second] = sorted;
    if (best === undefined || second === undefined || best === second) {
      problems.push(`${label}: no unique highest value`);
      return;
    }
    if (round.values[round.answerId] !== best) problems.push(`${label}: answer is not the highest`);
    if (new Set(values).size !== values.length) problems.push(`${label}: tied values`);

    const band = bands[index];
    const ratio = gapRatio(best, second);
    if (band && (ratio < band.minRatio || ratio > band.maxRatio)) {
      problems.push(`${label}: gap ${ratio.toFixed(3)} outside difficulty band`);
    }
  });
  return problems;
}
