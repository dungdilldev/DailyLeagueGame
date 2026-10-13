import type { ChampionsFile } from '../../src/data/schema';
import type { Puzzle } from '../../src/data/puzzleSchema';
import { gapRatio } from '../generate/buildRound';
import { ROUND_GAP_BANDS, type GapBand } from '../generate/config';

/** Independent re-check of a puzzle against the source data. Empty result = safe to publish. */
export function findPuzzleProblems(
  puzzle: Puzzle,
  data: ChampionsFile,
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
): string[] {
  const problems: string[] = [];
  const championsById = new Map(data.champions.map((champion) => [champion.id, champion]));
  const seenChampions = new Set<string>();
  const seenStats = new Set<string>();

  if (puzzle.rounds.length !== bands.length) {
    problems.push(`Expected ${String(bands.length)} rounds, got ${String(puzzle.rounds.length)}`);
  }

  puzzle.rounds.forEach((round, index) => {
    const label = `Round ${String(index + 1)}`;

    if (seenStats.has(round.statId)) problems.push(`${label}: stat "${round.statId}" repeated`);
    seenStats.add(round.statId);

    const values: number[] = [];
    for (const id of round.championIds) {
      const stored = championsById.get(id)?.stats[round.statId]?.value;
      if (stored === undefined) {
        problems.push(`${label}: unknown champion or stat for "${id}"`);
        continue;
      }
      if (round.values[id] !== stored)
        problems.push(`${label}: value for "${id}" does not match data`);
      if (seenChampions.has(id))
        problems.push(`${label}: champion "${id}" appears twice in the day`);
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
