import { goldEfficiency } from '../items/goldEfficiency';
import { DATA_DRAGON_SOURCE, LEAGUE_WIKI_SOURCE, type ItemStat, type ItemStatInput } from './types';

/** An item stat that is one of the wiki's own stat numbers (the wiki's short stat names). */
function wikiItemStat(id: string, label: string, wikiKey: string, question: string): ItemStat {
  return {
    id,
    subject: 'item',
    label,
    question,
    source: LEAGUE_WIKI_SOURCE,
    // Many items lack any given stat; those simply are not options for this question.
    minCoverage: 0.05,
    extract: ({ wiki }: ItemStatInput) => wiki.stats[wikiKey],
  };
}

export const itemCost: ItemStat = {
  id: 'itemCost',
  subject: 'item',
  label: 'Item cost',
  question: 'Which item costs the most gold?',
  source: DATA_DRAGON_SOURCE,
  extract: ({ item }) => item.gold.total,
};

export const itemGoldEfficiency: ItemStat = {
  id: 'itemGoldEfficiency',
  subject: 'item',
  label: 'Gold efficiency of stats',
  question: 'Which item is the most gold efficient from its stats alone (ignoring passives)?',
  source: LEAGUE_WIKI_SOURCE,
  format: { kind: 'percent' },
  extract: ({ item, wiki, goldValues }) => goldEfficiency(wiki, goldValues, item.gold.total),
};

export const itemAttackDamage = wikiItemStat(
  'itemAttackDamage',
  'Attack damage',
  'ad',
  'Which item gives the most attack damage?',
);
export const itemAbilityPower = wikiItemStat(
  'itemAbilityPower',
  'Ability power',
  'ap',
  'Which item gives the most ability power?',
);
export const itemHealth = wikiItemStat(
  'itemHealth',
  'Health',
  'hp',
  'Which item gives the most health?',
);
export const itemArmor = wikiItemStat(
  'itemArmor',
  'Armor',
  'armor',
  'Which item gives the most armor?',
);
export const itemMagicResist = wikiItemStat(
  'itemMagicResist',
  'Magic resistance',
  'mr',
  'Which item gives the most magic resistance?',
);
export const itemAbilityHaste = wikiItemStat(
  'itemAbilityHaste',
  'Ability haste',
  'ah',
  'Which item gives the most ability haste?',
);
