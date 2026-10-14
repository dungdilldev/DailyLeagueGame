import type { DataDragonItem } from '../sources/dataDragon';
import type { WikiItem } from '../sources/leagueWikiItems';

/** Summoner's Rift in Data Dragon's map list. */
const SUMMONERS_RIFT_MAP = '11';
/** Completed items cost at least this; it also drops components, starters and consumables. */
const MIN_COMPLETED_ITEM_COST = 900;
/** Wiki categories of the items players buy as their finished build. */
const COMPLETED_ITEM_TYPES: readonly string[] = ['Legendary', 'Boots'];
const CONSUMABLE_TAG = 'Consumable';

export interface SelectedItem {
  item: DataDragonItem;
  wiki: WikiItem;
}

/**
 * The completed items worth asking about: buyable on Summoner's Rift, not an ingredient of
 * anything, and known to the wiki as a legendary item or boots. Items that only exist in
 * other game modes (Arena copies and similar) have no wiki entry and drop out here.
 */
export function selectItems(
  items: readonly DataDragonItem[],
  wikiItems: readonly WikiItem[],
): SelectedItem[] {
  const wikiById = new Map(wikiItems.map((wiki) => [String(wiki.id), wiki]));

  return items.flatMap((item) => {
    const wiki = wikiById.get(item.id);
    const isCompleted =
      item.maps[SUMMONERS_RIFT_MAP] === true &&
      item.gold.purchasable &&
      item.gold.total >= MIN_COMPLETED_ITEM_COST &&
      (item.into?.length ?? 0) === 0 &&
      !(item.tags ?? []).includes(CONSUMABLE_TAG);
    const isWanted = wiki?.types.some((type) => COMPLETED_ITEM_TYPES.includes(type)) === true;
    return wiki && isCompleted && isWanted ? [{ item, wiki }] : [];
  });
}
