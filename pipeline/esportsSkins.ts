import type { ChampionDetail } from './sources/dataDragon';
import { isPurchasableSkin } from './stats/skinCount';

/**
 * Esports skin lines, read from the start of Data Dragon's skin names ("SSG Xayah", "DRX
 * Kindred"). Each maps to the name a question shows. SKT T1 and T1 are one organisation, so
 * they are one line: otherwise a champion with an SKT T1 skin could be offered as "no T1 skin".
 */
const TEAM_PREFIXES: Readonly<Record<string, string>> = {
  'SKT T1': 'T1 or SKT T1',
  T1: 'T1 or SKT T1',
  TPA: 'Taipei Assassins',
  SSW: 'Samsung White',
  SSG: 'Samsung Galaxy',
  iG: 'Invictus Gaming',
  FPX: 'FunPlus Phoenix',
  DWG: 'Damwon Gaming',
  EDG: 'Edward Gaming',
  DRX: 'DRX',
  Fnatic: 'Fnatic',
};

/** The yearly Worlds event skin, one champion a year: "Worlds 2019 Ryze". */
const WORLDS_SKIN = /^(Worlds \d{4}) /;

function skinLine(skinName: string): string | undefined {
  const worlds = WORLDS_SKIN.exec(skinName)?.[1];
  if (worlds !== undefined) return worlds;
  // Longest prefix first, so "SKT T1 Zed" is not read as a "SKT" skin.
  const prefix = Object.keys(TEAM_PREFIXES)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => skinName.startsWith(`${candidate} `));
  return prefix === undefined ? undefined : TEAM_PREFIXES[prefix];
}

/** The esports skin lines a champion has a skin in, sorted and without repeats. */
export function esportsSkinLines(detail: ChampionDetail): string[] {
  const lines = detail.skins.filter(isPurchasableSkin).flatMap((skin) => {
    const line = skinLine(skin.name);
    return line === undefined ? [] : [line];
  });
  return [...new Set(lines)].sort();
}
