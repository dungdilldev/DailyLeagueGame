import { describe, expect, it } from 'vitest';
import { buildChampion, buildChampionsFile } from '../../pipeline/buildChampions';
import { STAT_REGISTRY } from '../../pipeline/stats';
import { findProblems, MIN_CHAMPION_COUNT } from '../../pipeline/validate/championsFile';
import { makeInput } from './fixtures';

describe('buildChampion', () => {
  it('maps summary fields and records every registered stat with its source', () => {
    const champion = buildChampion(makeInput('Ahri'), '16.20.1', STAT_REGISTRY);

    expect(champion.iconUrl).toBe(
      'https://ddragon.leagueoflegends.com/cdn/16.20.1/img/champion/Ahri.png',
    );
    expect(champion.classes).toEqual(['Mage']);
    expect(Object.keys(champion.stats).sort()).toEqual(STAT_REGISTRY.map((s) => s.id).sort());
    expect(champion.stats['baseHealth']).toEqual({ value: 600, source: 'data-dragon' });
    expect(champion.stats['releaseDate']?.source).toBe('lol-wiki');
  });

  it('leaves out a stat whose value is unavailable instead of failing', () => {
    const champion = buildChampion(makeInput('New', { wiki: undefined }), '16.20.1', STAT_REGISTRY);
    expect(champion.stats['releaseDate']).toBeUndefined();
    expect(champion.stats['baseHealth']).toBeDefined();
  });
});

describe('buildChampionsFile', () => {
  it('sorts champions by id regardless of input order', () => {
    const file = buildChampionsFile(
      [makeInput('Zed'), makeInput('Ahri'), makeInput('Lux')],
      '16.20.1',
      STAT_REGISTRY,
    );
    expect(file.champions.map((c) => c.id)).toEqual(['Ahri', 'Lux', 'Zed']);
    expect(file.patch).toBe('16.20.1');
  });

  it('rejects a stat value that is not a valid number', () => {
    const broken = makeInput('Bad');
    broken.detail.stats.hp = Number.NaN;
    expect(() => buildChampionsFile([broken], '16.20.1', STAT_REGISTRY)).toThrow();
  });
});

describe('findProblems', () => {
  const fullRoster = Array.from({ length: MIN_CHAMPION_COUNT }, (_, i) =>
    makeInput(`Champ${String(i)}`),
  );

  it('accepts a complete roster', () => {
    const file = buildChampionsFile(fullRoster, '16.20.1', STAT_REGISTRY);
    expect(findProblems(file, STAT_REGISTRY)).toEqual([]);
  });

  it('flags a roster that is suspiciously small', () => {
    const file = buildChampionsFile(fullRoster.slice(0, 5), '16.20.1', STAT_REGISTRY);
    expect(findProblems(file, STAT_REGISTRY).join()).toContain('Only 5 champions');
  });

  it('flags duplicate champion ids', () => {
    const file = buildChampionsFile([...fullRoster, makeInput('Champ0')], '16.20.1', STAT_REGISTRY);
    expect(findProblems(file, STAT_REGISTRY).join()).toContain('Duplicate champion id "Champ0"');
  });

  it('tolerates a few champions missing a stat (e.g. brand new, not on the wiki yet)', () => {
    const roster = [...fullRoster.slice(1), makeInput('Fresh', { wiki: undefined })];
    const file = buildChampionsFile(roster, '16.20.1', STAT_REGISTRY);
    expect(findProblems(file, STAT_REGISTRY)).toEqual([]);
  });

  it('flags a stat that most champions lack, which means a source broke', () => {
    const roster = fullRoster.map((input) => ({ ...input, wiki: undefined }));
    const file = buildChampionsFile(roster, '16.20.1', STAT_REGISTRY);
    expect(findProblems(file, STAT_REGISTRY).join()).toContain('Stat "releaseDate"');
  });
});
