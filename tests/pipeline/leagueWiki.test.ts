import { describe, expect, it } from 'vitest';
import {
  buildWikiLookup,
  parseWikiChampions,
  type WikiChampion,
} from '../../pipeline/sources/leagueWiki';

/** Mirrors the real module layout: entries at 2 spaces, their fields at 4, nested tables deeper. */
function entry(name: string, id: number, date: string | undefined): string {
  return [
    `  ["${name}"] = {`,
    `    ["id"]         = ${String(id)},`,
    `    ["apiname"]    = "${name}",`,
    `    ["stats"] = {`,
    `      ["id"]  = 999,`,
    `      ["date"] = "1999-01-01",`,
    `    },`,
    ...(date ? [`    ["date"]        = "${date}",`] : []),
    `  },`,
  ].join('\n');
}

const luaWith = (entries: string[]) => `-- <pre>\nreturn {\n${entries.join('\n')}\n}\n`;
const manyEntries = (count: number) =>
  Array.from({ length: count }, (_, i) => entry(`Champ${String(i)}`, i + 1, '2015-05-05'));

describe('parseWikiChampions', () => {
  it('reads id, api name and release date, ignoring fields of nested tables', () => {
    const parsed = parseWikiChampions(
      luaWith([entry('Aatrox', 266, '2013-06-13'), ...manyEntries(120)]),
    );
    expect(parsed[0]).toEqual({ key: 266, apiName: 'Aatrox', releaseDate: '2013-06-13' });
  });

  it('accepts entries whose fields are indented with a tab', () => {
    // The real wiki has an entry (Aurora) whose id/apiname lines are indented "  <tab>".
    const tabbed = entry('Aurora', 893, '2024-07-17').replaceAll('\n    [', '\n  \t[');
    const parsed = parseWikiChampions(luaWith([tabbed, ...manyEntries(120)]));
    expect(parsed[0]).toEqual({ key: 893, apiName: 'Aurora', releaseDate: '2024-07-17' });
  });

  it('leaves the date out when the wiki has none', () => {
    const parsed = parseWikiChampions(
      luaWith([entry('Newbie', 900, undefined), ...manyEntries(120)]),
    );
    expect(parsed[0]?.releaseDate).toBeUndefined();
  });

  it('fails loudly when the format changes and almost nothing parses', () => {
    expect(() => parseWikiChampions('return { something = "else" }')).toThrow();
    expect(() => parseWikiChampions(luaWith(manyEntries(5)))).toThrow();
  });
});

describe('buildWikiLookup', () => {
  const champions: WikiChampion[] = [
    { key: 1, apiName: 'Annie', releaseDate: '2009-02-21' },
    { key: 777, apiName: 'Aurora', releaseDate: '2024-07-17' },
  ];
  const find = buildWikiLookup(champions);

  it('finds by numeric key', () => {
    expect(find(1, 'Whatever')?.apiName).toBe('Annie');
  });

  it('falls back to the api name when the keys disagree', () => {
    expect(find(893, 'Aurora')?.releaseDate).toBe('2024-07-17');
  });

  it('returns undefined for an unknown champion', () => {
    expect(find(5, 'Unknown')).toBeUndefined();
  });
});
