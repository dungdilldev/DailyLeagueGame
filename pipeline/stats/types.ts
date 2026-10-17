import type { StatFormat, StatId, StatMeta } from '../../src/data/schema';
import type { ChampionDetail, ChampionSummary, DataDragonItem } from '../sources/dataDragon';
import type { WikiChampion } from '../sources/leagueWiki';
import type { WikiItem } from '../sources/leagueWikiItems';

export const DATA_DRAGON_SOURCE = 'data-dragon';
export const LEAGUE_WIKI_SOURCE = 'lol-wiki';

const NUMBER_FORMAT: StatFormat = { kind: 'number' };

/** Everything the pipeline knows about one champion; stats pick the fields they need. */
export interface StatInput {
  summary: ChampionSummary;
  detail: ChampionDetail;
  /** Undefined when the wiki has no entry yet (e.g. a champion released today). */
  wiki: WikiChampion | undefined;
  /** Number of patches the champion was changed in; undefined if the wiki has no history page. */
  patchCount: number | undefined;
  /** The date ages are measured up to for "per year" stats; see `latestReleaseDate`. */
  referenceDate: string | undefined;
}

/** Everything the pipeline knows about one item. */
export interface ItemStatInput {
  item: DataDragonItem;
  wiki: WikiItem;
  /** Gold value of one point of each stat, from the wiki. */
  goldValues: Readonly<Record<string, number>>;
}

export interface StatBase {
  id: StatId;
  /** Human-readable name, e.g. "Base health". */
  label: string;
  /** Provenance, published with the stat definitions. */
  source: string;
  /** How values are shown to the player; plain numbers when omitted. */
  format?: StatFormat;
  /** Share of entities that must have a value; defaults to the usual 95%. */
  minCoverage?: number;
}

/** A stat about champions. */
export interface ChampionStat extends StatBase {
  /** Returns undefined when the value is not available for this champion. */
  extract: (input: StatInput) => number | undefined;
}

/** A stat about items. */
export interface ItemStat extends StatBase {
  /** Returns undefined when the item does not have this stat. */
  extract: (input: ItemStatInput) => number | undefined;
}

/** The part of a stat definition that is published to the client. */
export function toStatMeta(stat: StatBase): StatMeta {
  return {
    id: stat.id,
    label: stat.label,
    format: stat.format ?? NUMBER_FORMAT,
    source: stat.source,
  };
}
