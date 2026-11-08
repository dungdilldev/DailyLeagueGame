/**
 * The game's stat symbols, shown after a stat's value like a unit ("52 ⚔"). The files are on the
 * League of Legends Wiki, which hosts Riot's artwork; `npm run images:download` saves a copy of
 * each, so the site serves them itself.
 */
export const STAT_ICON_FILES = {
  health: 'Health icon.png',
  healthRegen: 'Health regeneration icon.png',
  armor: 'Armor icon.png',
  magicResist: 'Magic resistance icon.png',
  attackDamage: 'Attack damage icon.png',
  attackSpeed: 'Attack speed icon.png',
  attackRange: 'Range icon.png',
  moveSpeed: 'Movement speed icon.png',
  abilityPower: 'Ability power icon.png',
  /** The hourglass: cooldowns and ability haste (the wiki's "Cooldown icon" is too small). */
  cooldown: 'Cooldown reduction icon.png',
  mana: 'Mana icon.png',
  gold: 'Gold icon.png',
} as const;

export type StatIcon = keyof typeof STAT_ICON_FILES;

/** Where the downloaded symbols live below the site root. */
export const STAT_ICON_DIRECTORY = 'images/stats';

/** The served path of a symbol, e.g. "images/stats/armor.png". */
export function statIconUrl(icon: StatIcon): string {
  return `${STAT_ICON_DIRECTORY}/${icon}.png`;
}
