import type { Entity } from '../data/schema';
import type { Puzzle, Round } from './puzzle';
import { roundSymbols } from './textSymbols';

/** Addresses of the images a round shows, in display order; options without an image add none. */
export function roundImageUrls(round: Round, options: ReadonlyMap<string, Entity>): string[] {
  const symbols = roundSymbols(round);
  return round.optionIds.flatMap((id) => {
    const url = symbols?.urls[id] ?? options.get(id)?.iconUrl;
    return url === undefined ? [] : [url];
  });
}

/**
 * Every image the rest of the day will show, starting at the given round and without repeats, so
 * the images can be fetched before their round is reached.
 */
export function remainingImageUrls(
  puzzle: Puzzle,
  fromRoundIndex: number,
  entities: Readonly<Record<Round['subject'], ReadonlyMap<string, Entity>>>,
): string[] {
  const urls = puzzle.rounds
    .slice(fromRoundIndex)
    .flatMap((round) => roundImageUrls(round, entities[round.subject]));
  return [...new Set(urls)];
}
