import type { Entity, OptionSubject } from '../data/schema';
import type { PuzzleData } from './generate/buildPuzzle';

/** Champions and items by id, so a round's option ids can be turned back into entities. */
export type EntityLookup = Record<OptionSubject, ReadonlyMap<string, Entity>>;

export function buildEntityLookup(data: PuzzleData): EntityLookup {
  return {
    champion: new Map(data.champions.map((champion) => [champion.id, champion])),
    item: new Map(data.items.map((item) => [item.id, item])),
    // Text options have nothing to look up: the screen shows the id, which is the name.
    text: new Map(),
  };
}
