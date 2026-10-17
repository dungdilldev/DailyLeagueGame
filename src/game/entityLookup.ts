import type { Entity, StatSubject } from '../data/schema';
import type { PuzzleData } from './generate/buildPuzzle';

/** Champions and items by id, so a round's option ids can be turned back into entities. */
export type EntityLookup = Record<StatSubject, ReadonlyMap<string, Entity>>;

export function buildEntityLookup(data: PuzzleData): EntityLookup {
  return {
    champion: new Map(data.champions.map((champion) => [champion.id, champion])),
    item: new Map(data.items.map((item) => [item.id, item])),
  };
}
