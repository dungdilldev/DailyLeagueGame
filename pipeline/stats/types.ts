import type { StatId } from '../../src/data/schema';
import type { ChampionDetail, ChampionSummary } from '../sources/dataDragon';
import type { WikiChampion } from '../sources/leagueWiki';

export const DATA_DRAGON_SOURCE = 'data-dragon';
export const LEAGUE_WIKI_SOURCE = 'lol-wiki';

/** Everything the pipeline knows about one champion; stats pick the fields they need. */
export interface StatInput {
  summary: ChampionSummary;
  detail: ChampionDetail;
  /** Undefined when the wiki has no entry yet (e.g. a champion released today). */
  wiki: WikiChampion | undefined;
}

export interface StatDefinition {
  id: StatId;
  /** Human-readable name, e.g. "Base health". */
  label: string;
  /** The question shown to the player. A higher value is always the right answer. */
  question: string;
  /** Provenance written next to every value. */
  source: string;
  /** Returns undefined when the value is not available for this champion. */
  extract: (input: StatInput) => number | undefined;
  /** How to show a value to the player; plain numbers are shown as-is when omitted. */
  formatValue?: (value: number) => string;
}

export function highestQuestion(label: string): string {
  return `Which champion has the highest ${label.toLowerCase()}?`;
}
