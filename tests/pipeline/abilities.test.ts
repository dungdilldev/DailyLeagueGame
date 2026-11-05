import { describe, expect, it } from 'vitest';
import { collectAbilities, isSameAbility } from '../../pipeline/abilities/collectAbilities';
import { buildAbilities } from '../../pipeline/buildAbilities';
import { fetchAbilityTemplates } from '../../pipeline/sources/leagueWikiAbilities';
import { ABILITY_STATS } from '../../pipeline/stats';
import {
  abilityManaCost,
  basicAbilityCooldown,
  basicAbilityDamage,
  ultimateCooldown,
  ultimateDamage,
} from '../../pipeline/stats/abilityStats';
import type { AbilityStatInput } from '../../pipeline/stats/types';
import { makeDetail, makeSummary } from './fixtures';

const template = (name: string, cooldown = '10') =>
  `{{{{{1<noinclude>|Ability data</noinclude>}}}|${name}|\n|cooldown = ${cooldown}\n|leveling = {{st|Magic Damage|{{ap|50 to 250}} {{as|(+ 60% AP)}}}}\n}}`;

function abilityInput(slot: AbilityStatInput['slot'], overrides: Partial<AbilityStatInput> = {}) {
  return {
    id: `Ahri${slot}`,
    championName: 'Ahri',
    slot,
    spell: { name: 'Charm', image: { full: `Ahri${slot}.png` } },
    wiki: { name: 'Charm', damage: { base: 250, ratios: { ap: 60 } }, cooldown: 10 },
    ...overrides,
  };
}

describe('isSameAbility', () => {
  it('matches names regardless of case and punctuation', () => {
    expect(isSameAbility('To the Skies!', 'To The Skies')).toBe(true);
  });

  it('matches either form of a transforming ability', () => {
    expect(isSameAbility('Shock Blast', 'To the Skies! / Shock Blast')).toBe(true);
    expect(isSameAbility('Arc of Judgment', 'Arc of Judgment | Arc of Ruin')).toBe(true);
  });

  it('rejects a different ability', () => {
    expect(isSameAbility('Transform Mercury Cannon', 'Mercury Cannon / Mercury Hammer')).toBe(
      false,
    );
  });
});

describe('collectAbilities', () => {
  const summary = makeSummary('MonkeyKing', { name: 'Wukong' });

  it('pairs each slot with its Data Dragon spell, and leaves out missing or mismatched ones', () => {
    const detail = makeDetail('MonkeyKing', {
      spells: ['Crushing Blow', 'Warrior Trickster', 'Nimbus Strike', 'Cyclone'].map((name) => ({
        name,
        image: { full: `${name}.png` },
      })),
    });
    const abilities = collectAbilities(summary, detail, {
      Q: template('Crushing Blow'),
      W: template('Something Else'),
      R: template('Cyclone'),
    });
    expect(abilities.map(({ id, slot, championName }) => [id, slot, championName])).toEqual([
      ['MonkeyKingQ', 'Q', 'Wukong'],
      ['MonkeyKingR', 'R', 'Wukong'],
    ]);
    expect(abilities[1]?.spell.image.full).toBe('Cyclone.png');
  });
});

describe('ability stats', () => {
  it('keep basic abilities and ultimates apart for damage and cooldown', () => {
    const q = abilityInput('Q');
    const r = abilityInput('R');
    expect([basicAbilityDamage.extract(q), basicAbilityDamage.extract(r)]).toEqual([
      250,
      undefined,
    ]);
    expect([ultimateDamage.extract(q), ultimateDamage.extract(r)]).toEqual([undefined, 250]);
    expect([basicAbilityCooldown.extract(q), ultimateCooldown.extract(r)]).toEqual([10, 10]);
  });

  it('give nothing when the wiki value is absent', () => {
    expect(abilityManaCost.extract(abilityInput('Q'))).toBeUndefined();
  });

  it('have unique ids', () => {
    expect(new Set(ABILITY_STATS.map(({ id }) => id)).size).toBe(ABILITY_STATS.length);
  });
});

describe('buildAbilities', () => {
  it('names the champion and slot, points at its downloaded icon and sorts by id', () => {
    const abilities = buildAbilities(
      [abilityInput('W', { id: 'AhriW' }), abilityInput('E', { id: 'AhriE' })],
      ABILITY_STATS,
    );
    expect(abilities.map(({ id }) => id)).toEqual(['AhriE', 'AhriW']);
    expect(abilities[0]).toMatchObject({
      name: 'Ahri E · Charm',
      iconUrl: 'images/icons/abilities/AhriE.png',
      stats: { basicAbilityDamage: 250, abilityApRatio: 60, basicAbilityCooldown: 10 },
    });
  });

  it('leaves out abilities without any stat', () => {
    const empty = abilityInput('Q', { wiki: { name: 'Charm' } });
    expect(buildAbilities([empty], ABILITY_STATS)).toEqual([]);
  });
});

describe('fetchAbilityTemplates', () => {
  it("asks for each champion's Q, W, E and R template and groups them by champion", async () => {
    const requested: string[] = [];
    const templates = await fetchAbilityTemplates(['Ahri'], (url) => {
      const titles = (new URL(url).searchParams.get('titles') ?? '').split('|');
      requested.push(...titles);
      const pages = titles
        .filter((title) => !title.endsWith('/R'))
        .map((title) => ({
          title,
          revisions: [{ slots: { main: { content: `text of ${title}` } } }],
        }));
      return Promise.resolve(JSON.stringify({ query: { pages } }));
    });
    expect(requested).toEqual(['Q', 'W', 'E', 'R'].map((slot) => `Template:Data Ahri/${slot}`));
    expect(templates.get('Ahri')).toEqual({
      Q: 'text of Template:Data Ahri/Q',
      W: 'text of Template:Data Ahri/W',
      E: 'text of Template:Data Ahri/E',
    });
  });
});
