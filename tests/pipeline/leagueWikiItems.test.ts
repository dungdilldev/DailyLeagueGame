import { describe, expect, it } from 'vitest';
import { fetchWikiItemData, parseWikiItemData } from '../../pipeline/sources/leagueWikiItems';

const entry = (name: string, id: number, body: string) => `  ["${name}"] = {
    ["id"] = ${String(id)},
    ${body}
  },`;

/** Enough filler items to pass the "format changed" sanity check. */
const filler = Array.from({ length: 120 }, (_, i) =>
  entry(`Filler ${String(i)}`, 9000 + i, '["type"] = {"Legendary"}, ["stats"] = { ["ad"] = 10 }'),
);
const itemLua = (items: string[]) => `-- <pre>\nreturn {\n${[...items, ...filler].join('\n')}\n}`;
const goldLua = `return {
  ["ad"] = {["val"] = 35, ["name"] = "attack damage"},
  ["ah"] = {["val"] = 50, ["name"] = "ability haste"}, -- comment
}`;

describe('parseWikiItemData', () => {
  it('reads id, types, numeric stats, and the gold values', () => {
    const lua = itemLua([
      entry(
        'Infinity Edge',
        3031,
        '["type"] = {"Legendary"}, ["stats"] = { ["ad"] = 75, ["crit"] = 25 }',
      ),
    ]);
    const data = parseWikiItemData(lua, goldLua);
    expect(data.items.find((item) => item.name === 'Infinity Edge')).toEqual({
      id: 3031,
      name: 'Infinity Edge',
      types: ['Legendary'],
      stats: { ad: 75, crit: 25 },
      unresolvedStats: [],
    });
    expect(data.goldValues).toEqual({ ad: 35, ah: 50 });
  });

  it('accepts a single type given as text instead of a list', () => {
    const lua = itemLua([entry('Odd', 1, '["type"] = "Boots"')]);
    expect(parseWikiItemData(lua, goldLua).items.find((i) => i.name === 'Odd')?.types).toEqual([
      'Boots',
    ]);
  });

  it('resolves "same as that item" references for stats and types', () => {
    const lua = itemLua([
      entry('Muramana', 3042, '["type"] = {"Legendary"}, ["stats"] = { ["ad"] = 35, ["ah"] = 15 }'),
      entry(
        'Manamune',
        3004,
        '["type"] = "=>Muramana", ["stats"] = { ["ad"] = "=>Muramana", ["ah"] = "=>Muramana" }',
      ),
    ]);
    const manamune = parseWikiItemData(lua, goldLua).items.find((i) => i.name === 'Manamune');
    expect(manamune?.types).toEqual(['Legendary']);
    expect(manamune?.stats).toEqual({ ad: 35, ah: 15 });
  });

  it('lists stats that are not plain numbers instead of guessing a value', () => {
    const lua = itemLua([
      entry(
        'Adaptive',
        5,
        '["type"] = {"Legendary"}, ["stats"] = { ["ad"] = 10, ["spec"] = "+{{adaptive|80}}" }',
      ),
      entry('Loop', 6, '["stats"] = { ["ad"] = "=>Loop" }'),
    ]);
    const items = parseWikiItemData(lua, goldLua).items;
    expect(items.find((i) => i.name === 'Adaptive')).toMatchObject({
      stats: { ad: 10 },
      unresolvedStats: ['spec'],
    });
    // A reference cycle cannot be resolved and does not hang.
    expect(items.find((i) => i.name === 'Loop')?.unresolvedStats).toEqual(['ad']);
  });

  it('fails loudly when far too few items parse, which means the format changed', () => {
    const tooFew = 'return { ["A"] = { ["id"] = 1 } }';
    expect(() => parseWikiItemData(tooFew, goldLua)).toThrow(/format probably changed/);
    expect(() => parseWikiItemData('return {}', goldLua)).toThrow();
  });

  it('fails when the gold value table has an unexpected shape', () => {
    expect(() => parseWikiItemData(itemLua([]), 'return { ["ad"] = 5 }')).toThrow();
  });
});

describe('fetchWikiItemData', () => {
  it('downloads both modules and combines them', async () => {
    const urls: string[] = [];
    const data = await fetchWikiItemData((url) => {
      urls.push(url);
      return Promise.resolve(url.includes('Gold_value') ? goldLua : itemLua([]));
    });
    expect(urls).toHaveLength(2);
    expect(data.goldValues['ad']).toBe(35);
    expect(data.items.length).toBeGreaterThan(100);
  });
});
