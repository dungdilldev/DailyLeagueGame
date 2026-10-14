import type { StatFormat, StatId, StatMeta } from '../../src/data/schema';
import type { ChampionDetail, ChampionSummary } from '../sources/dataDragon';
import type { WikiChampion } from '../sources/leagueWiki';

export const DATA_DRAGON_SOURCE = 'data-dragon';
export const LEAGUE_WIKI_SOURCE = 'lol-wiki';

const NUMBER_FORMAT: StatFormat = { kind: 'number' };

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
  /** Provenance, published with the stat definitions. */
  source: string;
  /** How values are shown to the player; plain numbers when omitted. */
  format?: StatFormat;
  /** Returns undefined when the value is not available for this champion. */
  extract: (input: StatInput) => number | undefined;
}

export function highestQuestion(label: string): string {
  return `Which champion has the highest ${label.toLowerCase()}?`;
}

/** The part of a stat definition that is published to the client. */
export function toStatMeta(stat: StatDefinition): StatMeta {
  return {
    id: stat.id,
    label: stat.label,
    question: stat.question,
    format: stat.format ?? NUMBER_FORMAT,
    source: stat.source,
  };
}
