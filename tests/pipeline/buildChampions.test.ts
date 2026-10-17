import { describe, expect, it } from 'vitest';
import { buildChampion, buildChampions } from '../../pipeline/buildChampions';
import { buildItems } from '../../pipeline/buildItems';
import { CHAMPION_STATS, ITEM_STATS } from '../../pipeline/stats';
import {
  findEntityProblems,
  findQuestionListProblems,
  MIN_CHAMPION_COUNT,
  MIN_ITEM_COUNT,
  MIN_VALUES_PER_STAT,
} from '../../pipeline/validate/gameData';
import type { Question, StatQuestion } from '../../src/data/questions';
import type { Champion, Item } from '../../src/data/schema';
import { makeInput, makeItemInput } from './fixtures';

const championStats = CHAMPION_STATS;
const itemStats = ITEM_STATS;

describe('buildChampion', () => {
  it('maps summary fields and records every champion stat', () => {
    const champion = buildChampion(makeInput('Ahri'), '16.20.1', championStats);

    expect(champion.iconUrl).toBe(
      'https://ddragon.leagueoflegends.com/cdn/16.20.1/img/champion/Ahri.png',
    );
    expect(champion.classes).toEqual(['Mage']);
    expect(Object.keys(champion.stats).sort()).toEqual(championStats.map((s) => s.id).sort());
    expect(champion.stats['baseHealth']).toBe(600);
    expect(champion.stats['releaseDate']).toBeGreaterThan(0);
    expect(champion.stats['patchCount']).toBe(12);
  });

  it('leaves out a stat whose value is unavailable instead of failing', () => {
    const input = makeInput('New', { wiki: undefined, patchCount: undefined });
    const champion = buildChampion(input, '16.20.1', championStats);
    expect(champion.stats['releaseDate']).toBeUndefined();
    expect(champion.stats['patchCount']).toBeUndefined();
    expect(champion.stats['baseHealth']).toBeDefined();
  });
});

describe('buildChampions', () => {
  it('sorts champions by id regardless of input order', () => {
    const champions = buildChampions(
      [makeInput('Zed'), makeInput('Ahri'), makeInput('Lux')],
      '16.20.1',
      championStats,
    );
    expect(champions.map((c) => c.id)).toEqual(['Ahri', 'Lux', 'Zed']);
  });

  it('passes a bad number through so the schema check at the publish boundary can reject it', () => {
    const broken = makeInput('Bad');
    broken.detail.stats.hp = Number.NaN;
    const [champion] = buildChampions([broken], '16.20.1', championStats);
    expect(Number.isNaN(champion?.stats['baseHealth'])).toBe(true);
  });
});

describe('buildItems', () => {
  it('maps the item, its icon and every item stat it has', () => {
    const [item] = buildItems([makeItemInput('3031')], '16.20.1', itemStats);
    expect(item).toMatchObject({
      id: '3031',
      name: 'Item 3031',
      iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.20.1/img/item/3031.png',
    });
    expect(item?.stats['itemCost']).toBe(3000);
    expect(item?.stats['itemAttackDamage']).toBe(60);
    expect(item?.stats['itemAbilityHaste']).toBe(20);
    // Not every item grants every stat.
    expect(item?.stats['itemAbilityPower']).toBeUndefined();
  });

  it('sorts items by name regardless of input order', () => {
    const items = buildItems(
      [makeItemInput('2'), makeItemInput('1'), makeItemInput('3')],
      '16.20.1',
      itemStats,
    );
    expect(items.map((item) => item.id)).toEqual(['1', '2', '3']);
  });
});

function findProblems(data: { champions: Champion[]; items: Item[] }): string[] {
  return [
    ...findEntityProblems('champion', data.champions, CHAMPION_STATS, MIN_CHAMPION_COUNT),
    ...findEntityProblems('item', data.items, ITEM_STATS, MIN_ITEM_COUNT),
  ];
}

describe('findProblems', () => {
  const roster = (count: number) =>
    Array.from({ length: count }, (_, i) => makeInput(`Champ${String(i)}`));
  /** Items with an attack-damage-style spread so every item stat has enough values. */
  const itemRoster = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      makeItemInput(String(1000 + i), {
        wiki: {
          id: 1000 + i,
          name: `Item ${String(i)}`,
          types: ['Legendary'],
          stats: { ad: 10 + i, ap: 10 + i, hp: 100 + i, armor: 10 + i, mr: 10 + i, ah: 10 + i },
          unresolvedStats: [],
        },
      }),
    );
  const build = (champions = roster(MIN_CHAMPION_COUNT), items = itemRoster(MIN_ITEM_COUNT)) => ({
    champions: buildChampions(champions, '16.20.1', championStats),
    items: buildItems(items, '16.20.1', itemStats),
  });

  it('accepts a complete set of champions and items', () => {
    expect(findProblems(build())).toEqual([]);
  });

  it('flags too few champions or too few items', () => {
    expect(findProblems(build(roster(5))).join()).toContain('Only 5 champions');
    expect(findProblems(build(undefined, itemRoster(3))).join()).toContain('Only 3 items');
  });

  it('flags duplicate ids', () => {
    const data = build([...roster(MIN_CHAMPION_COUNT), makeInput('Champ0')]);
    expect(findProblems(data).join()).toContain('Duplicate champion id "Champ0"');
  });

  it('tolerates a few champions missing a stat (e.g. brand new, not on the wiki yet)', () => {
    const champions = [
      ...roster(MIN_CHAMPION_COUNT).slice(1),
      makeInput('Fresh', { wiki: undefined }),
    ];
    expect(findProblems(build(champions))).toEqual([]);
  });

  it('flags a champion stat that most champions lack, which means a source broke', () => {
    const champions = roster(MIN_CHAMPION_COUNT).map((input) => ({
      ...input,
      patchCount: undefined,
    }));
    expect(findProblems(build(champions)).join()).toContain('Stat "patchCount"');
  });

  it('flags an item stat that too few items have, since no round could be built', () => {
    const sparse = itemRoster(MIN_ITEM_COUNT).map((input, index) =>
      index < MIN_VALUES_PER_STAT - 1 ? input : { ...input, wiki: { ...input.wiki, stats: {} } },
    );
    expect(findProblems(build(undefined, sparse)).join()).toContain('Stat "itemAttackDamage"');
  });

  it('accepts an item stat that only some items have, as long as enough do', () => {
    // Only every third item grants ability power.
    const withoutAp = (input: ReturnType<typeof makeItemInput>) => ({
      ...input,
      wiki: {
        ...input.wiki,
        stats: Object.fromEntries(Object.entries(input.wiki.stats).filter(([key]) => key !== 'ap')),
      },
    });
    const items = itemRoster(MIN_ITEM_COUNT * 3).map((input, index) =>
      index % 3 === 0 ? input : withoutAp(input),
    );
    expect(findProblems(build(undefined, items))).toEqual([]);
  });
});

describe('findQuestionListProblems', () => {
  const question = (overrides: Partial<StatQuestion>): StatQuestion => ({
    kind: 'stat',
    id: 'q',
    category: 'stats',
    difficulty: 'variable',
    stat: 'baseHealth',
    question: 'Which champion has the highest base health?',
    subject: 'champion',
    statMeta: {
      id: 'baseHealth',
      label: 'Base health',
      format: { kind: 'number' },
      source: 'test',
    },
    ...overrides,
  });
  const known = { champion: new Set(['Ahri', 'Zed']), item: new Set(['3031']) };

  it('accepts lists that only name champions or items that exist', () => {
    const questions = [question({ correct: ['Ahri'], wrong: ['Zed'], exclude: [] })];
    expect(findQuestionListProblems(questions, known)).toEqual([]);
  });

  it('flags an id that is gone, in any of the three lists', () => {
    const questions = [question({ correct: ['Gone1'], wrong: ['Gone2'], exclude: ['Gone3'] })];
    expect(findQuestionListProblems(questions, known)).toEqual([
      'Question "q" lists unknown champion id "Gone1"',
      'Question "q" lists unknown champion id "Gone2"',
      'Question "q" lists unknown champion id "Gone3"',
    ]);
  });

  it('looks up ids among items for an item question', () => {
    const questions = [question({ subject: 'item', exclude: ['Ahri'] })];
    expect(findQuestionListProblems(questions, known)).toHaveLength(1);
  });

  it('checks pick questions too', () => {
    const pick: Question = {
      kind: 'pick',
      id: 'p',
      category: 'lore',
      difficulty: 'easy',
      subject: 'champion',
      label: 'Mages',
      question: 'Which of these champions is a mage?',
      correct: ['Ahri'],
      wrong: ['Zed', 'Gone', 'Gone2'],
    };
    expect(findQuestionListProblems([pick], known)).toEqual([
      'Question "p" lists unknown champion id "Gone"',
      'Question "p" lists unknown champion id "Gone2"',
    ]);
  });
});
