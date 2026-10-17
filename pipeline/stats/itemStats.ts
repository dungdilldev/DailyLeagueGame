import { goldEfficiency } from '../items/goldEfficiency';
import { DATA_DRAGON_SOURCE, LEAGUE_WIKI_SOURCE, type ItemStat, type ItemStatInput } from './types';

/** An item stat that is one of the wiki's own stat numbers (the wiki's short stat names). */
function wikiItemStat(id: string, label: string, wikiKey: string): ItemStat {
  return {
    id,
    label,
    source: LEAGUE_WIKI_SOURCE,
    // Many items lack any given stat; those simply are not options for this question.
    minCoverage: 0.05,
    extract: ({ wiki }: ItemStatInput) => wiki.stats[wikiKey],
  };
}

export const itemCost: ItemStat = {
  id: 'itemCost',
  label: 'Item cost',
  source: DATA_DRAGON_SOURCE,
  extract: ({ item }) => item.gold.total,
};

export const itemGoldEfficiency: ItemStat = {
  id: 'itemGoldEfficiency',
  label: 'Gold efficiency of stats',
  source: LEAGUE_WIKI_SOURCE,
  format: { kind: 'percent' },
  extract: ({ item, wiki, goldValues }) => goldEfficiency(wiki, goldValues, item.gold.total),
};

export const itemAttackDamage = wikiItemStat('itemAttackDamage', 'Attack damage', 'ad');
export const itemAbilityPower = wikiItemStat('itemAbilityPower', 'Ability power', 'ap');
export const itemHealth = wikiItemStat('itemHealth', 'Health', 'hp');
export const itemArmor = wikiItemStat('itemArmor', 'Armor', 'armor');
export const itemMagicResist = wikiItemStat('itemMagicResist', 'Magic resistance', 'mr');
export const itemAbilityHaste = wikiItemStat('itemAbilityHaste', 'Ability haste', 'ah');
