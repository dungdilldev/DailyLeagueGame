import { describe, expect, it } from 'vitest';
import { STAT_REGISTRY } from '../../pipeline/stats';
import { armor, baseHealth } from '../../pipeline/stats/baseStats';
import { skinCount } from '../../pipeline/stats/skinCount';
import { makeDetail } from './fixtures';

describe('skinCount', () => {
  it('excludes the default skin and parenthesised variants', () => {
    const detail = makeDetail('Ahri', {
      skins: [
        { num: 0, name: 'default' },
        { num: 1, name: 'Dynasty Ahri' },
        { num: 2, name: 'Popstar Ahri' },
        { num: 3, name: 'Popstar Ahri (Ruby)' },
        { num: 4, name: 'Prestige K/DA Ahri (2022)' },
      ],
    });
    expect(skinCount.extract(detail)).toBe(2);
  });

  it('is zero for a champion with only the default skin', () => {
    expect(skinCount.extract(makeDetail('Newbie'))).toBe(0);
  });
});

describe('base stats', () => {
  it('copies the matching Data Dragon field', () => {
    const detail = makeDetail('Ahri');
    expect(baseHealth.extract(detail)).toBe(600);
    expect(armor.extract(detail)).toBe(20);
  });
});

describe('STAT_REGISTRY', () => {
  it('has unique stat ids', () => {
    const ids = STAT_REGISTRY.map((stat) => stat.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
