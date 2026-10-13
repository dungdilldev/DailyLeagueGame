import type { StatId } from '../../src/data/schema';
import type { ChampionDetail } from '../sources/dataDragon';

export const DATA_DRAGON_SOURCE = 'data-dragon';

export interface StatDefinition {
  id: StatId;
  /** Human-readable name, e.g. "Base health". */
  label: string;
  /** Provenance written next to every value. */
  source: string;
  extract: (detail: ChampionDetail) => number;
}
