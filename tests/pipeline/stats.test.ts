import { describe, expect, it } from 'vitest';
import { CHAMPION_STATS, ITEM_STATS } from '../../pipeline/stats';
import { armor, baseHealth } from '../../pipeline/stats/baseStats';
import { RELEASE_DATE_EPOCH, releaseDate } from '../../pipeline/stats/releaseDate';
import { skinCount } from '../../pipeline/stats/skinCount';
import { toStatMeta } from '../../pipeline/stats/types';
import { makeDetail, makeInput, makeWiki } from './fixtures';

describe('skinCount', () => {
  it('excludes the default skin and parenthesised variants', () => {
    const input = makeInput('Ahri', {
      detail: makeDetail('Ahri', {
        skins: [
          { num: 0, name: 'default' },
          { num: 1, name: 'Dynasty Ahri' },
          { num: 2, name: 'Popstar Ahri' },
          { num: 3, name: 'Popstar Ahri (Ruby)' },
          { num: 4, name: 'Prestige K/DA Ahri (2022)' },
        ],
      }),
    });
    expect(skinCount.extract(input)).toBe(2);
  });

  it('is zero for a champion with only the default skin', () => {
    expect(skinCount.extract(makeInput('Newbie'))).toBe(0);
  });
});

describe('base stats', () => {
  it('copies the matching Data Dragon field', () => {
    const input = makeInput('Ahri');
    expect(baseHealth.extract(input)).toBe(600);
    expect(armor.extract(input)).toBe(20);
  });
});

describe('releaseDate', () => {
  it('is a later (higher) value for a later release', () => {
    const early = releaseDate.extract(
      makeInput('A', { wiki: makeWiki('A', { releaseDate: '2010-01-01' }) }),
    );
    const late = releaseDate.extract(
      makeInput('B', { wiki: makeWiki('B', { releaseDate: '2024-07-17' }) }),
    );
    expect(early).toBeDefined();
    expect(late).toBeGreaterThan(early ?? Infinity);
  });

  it('counts days since the epoch', () => {
    const input = makeInput('A', { wiki: makeWiki('A', { releaseDate: '2009-01-11' }) });
    expect(RELEASE_DATE_EPOCH).toBe('2009-01-01');
    expect(releaseDate.extract(input)).toBe(10);
  });

  it('is unavailable without a wiki entry or date', () => {
    expect(releaseDate.extract(makeInput('A', { wiki: undefined }))).toBeUndefined();
    expect(
      releaseDate.extract(makeInput('A', { wiki: makeWiki('A', { releaseDate: undefined }) })),
    ).toBeUndefined();
  });

  it('declares a date format counted from the same epoch it stores', () => {
    expect(releaseDate.format).toEqual({ kind: 'date', epoch: RELEASE_DATE_EPOCH });
  });
});

describe('toStatMeta', () => {
  it('defaults to the plain number format and keeps the source', () => {
    expect(toStatMeta(skinCount)).toMatchObject({
      id: 'skinCount',
      format: { kind: 'number' },
      source: 'data-dragon',
    });
    expect(toStatMeta(releaseDate).format.kind).toBe('date');
  });
});

describe('stat lists', () => {
  it('have unique stat ids within each data file', () => {
    for (const stats of [CHAMPION_STATS, ITEM_STATS]) {
      const ids = stats.map((stat) => stat.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
