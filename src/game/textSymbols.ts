import type { Round } from './puzzle';

/** Crest images are hotlinked from the League of Legends Wiki, which hosts Riot's artwork. */
const CREST_BASE_URL = 'https://wiki.leagueoflegends.com/en-us/images/';

function crestUrl(fileName: string): string {
  return `${CREST_BASE_URL}${encodeURIComponent(fileName.replaceAll(' ', '_'))}`;
}

/**
 * Crest file per option name, only for options that *are* the region or group itself. A place
 * inside a nation gets none: showing its nation's crest would give away "Which of these places
 * is in Demacia?".
 */
const SYMBOL_FILES: Readonly<Record<string, string>> = {
  Demacia: 'Demacia Crest icon.png',
  Noxus: 'Noxus Crest icon.png',
  Ionia: 'Ionia Crest icon.png',
  Freljord: 'Freljord Crest icon.png',
  Shurima: 'Shurima Crest icon.png',
  Targon: 'Targon Crest icon.png',
  Ixtal: 'Ixtal Crest icon.png',
  Piltover: 'Piltover Crest icon.png',
  Zaun: 'Zaun Crest icon.png',
  Bilgewater: 'Bilgewater Crest icon.png',
  Camavor: 'Camavor Crest icon.png',
  'Shadow Isles': 'Shadow Isles Crest icon.png',
  'The Shadow Isles': 'Shadow Isles Crest icon.png',
  'The Void': 'Void Crest icon.png',
  'The Voidborn': 'Void Crest icon.png',
  'Black Rose': 'Black Rose Crest icon.png',
  'The Black Rose': 'Black Rose Crest icon.png',
  Mageseekers: 'Mageseeker Crest icon.png',
  'The Mageseekers': 'Mageseeker Crest icon.png',
  'Dauntless Vanguard': 'Dauntless Vanguard Crest icon.png',
  'The Dauntless Vanguard': 'Dauntless Vanguard Crest icon.png',
  Illuminators: 'Illuminator Crest icon.png',
  'Sentinels of Light': 'Sentinels of Light Crest icon.svg',
  'House Medarda': 'Medarda Clan Crest icon.png',
  'House Buvelle': 'Buvelle House Crest icon.png',
  'House Crownguard': 'Crownguard House Crest icon.png',
  'House Lightshield': 'Lightshield House Crest icon.png',
};

/**
 * The crest to show for each option of a text round, by option id, or undefined when the round
 * shows none. It is all or nothing: if only some options had a crest, the cards without one
 * would stand out and hint at the answer.
 */
export function roundSymbols(round: Round): Readonly<Record<string, string>> | undefined {
  if (round.subject !== 'text') return undefined;
  const files = round.optionIds.map((id) => SYMBOL_FILES[id]);
  if (files.some((file) => file === undefined)) return undefined;
  return Object.fromEntries(round.optionIds.map((id, index) => [id, crestUrl(files[index] ?? '')]));
}
