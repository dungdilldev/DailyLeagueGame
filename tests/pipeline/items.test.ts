import { describe, expect, it } from 'vitest';
import { goldEfficiency } from '../../pipeline/items/goldEfficiency';
import { selectItems } from '../../pipeline/items/selectItems';
import { itemGoldEfficiency, itemCost, itemAttackDamage } from '../../pipeline/stats/itemStats';
import { GOLD_VALUES, makeDataDragonItem, makeItemInput, makeWikiItem } from './fixtures';

describe('goldEfficiency', () => {
  it('is the gold value of the stats divided by the price, as a percentage', () => {
    // 60 AD (35 each) + 20 AH (50 each) = 3100 gold of stats for a 3000 gold item.
    const item = makeWikiItem('1', { stats: { ad: 60, ah: 20 } });
    expect(goldEfficiency(item, GOLD_VALUES, 3000)).toBe(103.3);
  });

  it('rounds to one decimal, since that is what players see', () => {
    const item = makeWikiItem('1', { stats: { ad: 1 } });
    expect(goldEfficiency(item, GOLD_VALUES, 3)).toBe(1166.7);
  });

  it('is below 100% for an item whose value is mostly in a passive', () => {
    const item = makeWikiItem('1', { stats: { ap: 50 } });
    expect(goldEfficiency(item, GOLD_VALUES, 3500)).toBeLessThan(100);
  });

  it('is unavailable when a stat has no known gold value, rather than undercounting', () => {
    const item = makeWikiItem('1', { stats: { ad: 60, gp10: 5 } });
    expect(goldEfficiency(item, GOLD_VALUES, 3000)).toBeUndefined();
  });

  it('is unavailable when a stat could not be turned into a number', () => {
    const item = makeWikiItem('1', { stats: { ad: 60 }, unresolvedStats: ['spec'] });
    expect(goldEfficiency(item, GOLD_VALUES, 3000)).toBeUndefined();
  });

  it('is unavailable for an item with no stats or no price', () => {
    expect(goldEfficiency(makeWikiItem('1', { stats: {} }), GOLD_VALUES, 3000)).toBeUndefined();
    expect(goldEfficiency(makeWikiItem('1'), GOLD_VALUES, 0)).toBeUndefined();
  });
});

describe('selectItems', () => {
  const wiki = (id: string, types: string[]) => makeWikiItem(id, { types });

  it("keeps completed legendary items and boots that are sold on Summoner's Rift", () => {
    const selected = selectItems(
      [
        makeDataDragonItem('1'),
        makeDataDragonItem('2', { gold: { total: 1000, purchasable: true } }),
      ],
      [wiki('1', ['Legendary']), wiki('2', ['Boots'])],
    );
    expect(selected.map((s) => s.item.id)).toEqual(['1', '2']);
  });

  it.each([
    ['a component (it builds into something)', { into: ['3031'] }],
    ['a cheap item', { gold: { total: 450, purchasable: true } }],
    ['an item that cannot be bought', { gold: { total: 3000, purchasable: false } }],
    ['a consumable', { tags: ['Consumable'] }],
    ["an item not sold on Summoner's Rift", { maps: { '11': false, '12': true } }],
  ])('drops %s', (_label, overrides) => {
    expect(selectItems([makeDataDragonItem('1', overrides)], [wiki('1', ['Legendary'])])).toEqual(
      [],
    );
  });

  it('drops items of other kinds, and items the wiki does not know', () => {
    expect(selectItems([makeDataDragonItem('1')], [wiki('1', ['Starter'])])).toEqual([]);
    expect(selectItems([makeDataDragonItem('1')], [wiki('2', ['Legendary'])])).toEqual([]);
  });

  it('matches wiki and Data Dragon items by id, not by name', () => {
    const selected = selectItems(
      [makeDataDragonItem('3031', { name: 'Infinity Edge' })],
      [makeWikiItem('3031', { name: 'Something else', types: ['Legendary'] })],
    );
    expect(selected).toHaveLength(1);
  });
});

describe('item stats', () => {
  it('cost comes from Data Dragon, the current price', () => {
    expect(itemCost.extract(makeItemInput('1'))).toBe(3000);
  });

  it('gold efficiency uses the wiki stats and the Data Dragon price', () => {
    expect(itemGoldEfficiency.extract(makeItemInput('1'))).toBe(103.3);
    expect(itemGoldEfficiency.format).toEqual({ kind: 'percent' });
  });

  it('a stat an item does not grant is unavailable, not zero', () => {
    expect(itemAttackDamage.extract(makeItemInput('1'))).toBe(60);
    const noAd = makeItemInput('2', { wiki: makeWikiItem('2', { stats: { hp: 300 } }) });
    expect(itemAttackDamage.extract(noAd)).toBeUndefined();
  });

  it('all item questions ask about items, and are phrased so the highest value is the answer', () => {
    for (const stat of [itemCost, itemGoldEfficiency, itemAttackDamage]) {
      expect(stat.subject).toBe('item');
      expect(stat.question).toMatch(/^Which item .*\?$/);
    }
  });
});
