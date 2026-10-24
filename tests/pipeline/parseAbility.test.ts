import { describe, expect, it } from 'vitest';
import { parseAbility, parseDamageLine } from '../../pipeline/abilities/parseAbility';

/** A data template in the wiki's shape, with the given fields. */
function template(name: string, fields: Record<string, string>, prefix = ''): string {
  const lines = Object.entries(fields).map(([key, value]) => `|${key} = ${value}`);
  return `${prefix}{{{{{1<noinclude>|Ability data</noinclude>}}}|${name}|{{{2|}}}|{{{3|}}}\n|champion = X\n${lines.join('\n')}\n}}`;
}

describe('parseDamageLine', () => {
  it('reads the base and the AP, AD and bonus AD ratios at max rank', () => {
    expect(
      parseDamageLine(
        "{{ap|80 to 280}} {{as|(+ 60% '''bonus''' AD)}} {{as|(+ {{ap|35 to 75}}% AP)}} {{as|(+ 130% AD)}}",
      ),
    ).toEqual({ base: 280, ratios: { bonusAd: 60, ap: 75, ad: 130 } });
  });

  it('allows ratios to other stats without keeping them', () => {
    expect(
      parseDamageLine("{{ap|50 to 150}} {{as|(+ 30% AP)}} {{as|(+ 2% '''maximum''' mana)}}"),
    ).toEqual({ base: 150, ratios: { ap: 30 } });
  });

  it('rejects a line with a formula, a missing base or a repeated ratio', () => {
    expect(
      parseDamageLine(
        "{{ap|60 to 180}} {{as|(+ 3% {{as|(+ 1.5% per 100 AP)}} of target's health)}}",
      ),
    ).toBeUndefined();
    expect(parseDamageLine('{{as|{{ap|20 to 40}}% AD}}')).toBeUndefined();
    expect(parseDamageLine('{{ap|10 to 50}} {{as|(+ 10% AP)}} {{as|(+ 20% AP)}}')).toBeUndefined();
    expect(parseDamageLine('{{ap|10 to 50}} per second')).toBeUndefined();
  });
});

describe('parseAbility', () => {
  const charm = template('Charm', {
    leveling:
      '{{st|Magic Damage|{{ap|80 to 240}} {{as|(+ 85% AP)}}|Charm Duration|{{ap|1.4 to 2}}}}',
    cooldown: '12',
    cost: '{{ap|60}}',
    costtype: 'Mana',
  });

  it('reads the name, damage, cooldown and mana cost', () => {
    expect(parseAbility(charm)).toEqual({
      name: 'Charm',
      damage: { base: 240, ratios: { ap: 85 } },
      cooldown: 12,
      manaCost: 60,
    });
  });

  it('reads numbers defined as variables at the top of the template', () => {
    const text = template(
      'The Darkin Blade',
      {
        leveling:
          '{{st|Physical Damage|{{ap|{{#var:b1}} to {{#var:b5}}}} {{as|(+ {{#var:r}}% AD)}}}}',
      },
      '{{#vardefine:b1|10}}{{#vardefine:b5|70}}{{#vardefine:r|90}}',
    );
    expect(parseAbility(text)?.damage).toEqual({ base: 70, ratios: { ad: 90 } });
  });

  it('ignores minion and monster lines next to the champion damage', () => {
    const text = template('Infernal Chains', {
      leveling:
        '{{st|Physical Damage|{{ap|30 to 70}} {{as|(+ 40% AD)}}|Minion Damage|{{ap|60 to 140}}}}',
    });
    expect(parseAbility(text)?.damage?.base).toBe(70);
  });

  it('leaves the damage out when there is more than one damage line', () => {
    const text = template('Orb of Deception', {
      leveling: '{{st|Magic Damage Per Tick|{{ap|5 to 10}}|Total Magic Damage|{{ap|50 to 100}}}}',
    });
    expect(parseAbility(text)?.damage).toBeUndefined();
  });

  it('leaves the damage out for "bonus" or per-tick damage', () => {
    const text = template('Spinning Axe', {
      leveling: '{{st|Bonus Physical Damage|{{ap|40 to 60}}}}',
    });
    expect(parseAbility(text)?.damage).toBeUndefined();
  });

  it('leaves the cooldown out for abilities with charges, or a cooldown of zero', () => {
    const ammo = template('Noxian Guillotine', { cooldown: '5', recharge: '{{ap|90 to 50}}' });
    expect(parseAbility(ammo)?.cooldown).toBeUndefined();
    expect(
      parseAbility(template('Toggle', { cooldown: '{{ap|12 to 0}}' }))?.cooldown,
    ).toBeUndefined();
  });

  it('only counts costs paid in mana alone', () => {
    const energy = template('Five Point Strike', { cost: '120', costtype: 'Energy' });
    const mixed = template('Turret', { cost: '50', costtype: 'Mana + 1 Turret Kit' });
    expect(parseAbility(energy)?.manaCost).toBeUndefined();
    expect(parseAbility(mixed)?.manaCost).toBeUndefined();
  });

  it('is undefined for text that is not an ability template', () => {
    expect(parseAbility('#REDIRECT [[Template:Data Ahri/Charm]]')).toBeUndefined();
  });
});
