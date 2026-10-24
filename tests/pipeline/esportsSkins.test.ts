import { describe, expect, it } from 'vitest';
import { esportsSkinLines } from '../../pipeline/esportsSkins';
import { findEsportsSkinProblems } from '../../pipeline/validate/gameData';
import type { Champion } from '../../src/data/schema';
import { makeDetail } from './fixtures';

const withSkins = (...names: string[]) =>
  makeDetail('Zed', {
    skins: [{ num: 0, name: 'default' }, ...names.map((name, index) => ({ num: index + 1, name }))],
  });

describe('esportsSkinLines', () => {
  it('reads the team or Worlds year at the start of each skin name', () => {
    expect(esportsSkinLines(withSkins('SSG Xayah', 'Worlds 2019 Ryze', 'Project: Zed'))).toEqual([
      'Samsung Galaxy',
      'Worlds 2019',
    ]);
  });

  it('treats SKT T1 and T1 as one line, listed once', () => {
    expect(esportsSkinLines(withSkins('SKT T1 Lee Sin', 'T1 Lee Sin'))).toEqual(['T1 or SKT T1']);
  });

  it('ignores chromas, prestige editions and names that only start alike', () => {
    expect(
      esportsSkinLines(withSkins('DRX Aatrox (Ruby)', 'Dragonslayer Braum', 'iGnite Zed')),
    ).toEqual([]);
  });
});

describe('findEsportsSkinProblems', () => {
  const champion = (id: string, lines?: string[]): Champion => ({
    id,
    name: id,
    title: `the ${id}`,
    classes: [],
    iconUrl: 'https://example.com/x.png',
    stats: {},
    ...(lines && { esportsSkinLines: lines }),
  });

  it('fails when far fewer champions than usual have an esports skin', () => {
    expect(findEsportsSkinProblems([champion('A', ['DRX']), champion('B')])).toHaveLength(1);
    const many = Array.from({ length: 40 }, (_, i) => champion(String(i), ['DRX']));
    expect(findEsportsSkinProblems(many)).toEqual([]);
  });
});
