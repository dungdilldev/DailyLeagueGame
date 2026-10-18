import {
  ESPORTS_IMAGE_DIRECTORY,
  esportsImagePath,
  esportsImages,
  type EsportsImageKind,
} from '../data/esportsImages';
import type { Round } from './puzzle';

/** Crest images are hotlinked from the League of Legends Wiki, which hosts Riot's artwork. */
const CREST_BASE_URL = 'https://wiki.leagueoflegends.com/en-us/images/';

/** A crest or logo is drawn as is; a photo of a person gets a portrait frame. */
export type SymbolKind = 'crest' | 'photo';

export interface RoundSymbols {
  readonly kind: SymbolKind;
  /** Image address by option id. */
  readonly urls: Readonly<Record<string, string>>;
}

/**
 * Photos show players in the jersey of the team they were photographed with, so a question
 * that names a team ("has played for {team}") would be answered by the photo.
 */
const QUESTIONS_WITHOUT_PHOTOS: readonly string[] = ['playerByTeam'];

function fileUrl(baseUrl: string, fileName: string): string {
  return `${baseUrl}${encodeURIComponent(fileName.replaceAll(' ', '_'))}`;
}

/**
 * Crest file per option name, only for options that *are* the region or group itself. A place
 * inside a nation gets none: showing its nation's crest would give away "Which of these places
 * is in Demacia?".
 */
const LORE_CREST_FILES: Readonly<Record<string, string>> = {
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

/** Downloaded esports image, if there is one for this name. */
function esportsImageUrl(kind: EsportsImageKind, name: string): string | undefined {
  if (!(name in esportsImages[kind])) return undefined;
  return `${import.meta.env.BASE_URL}${ESPORTS_IMAGE_DIRECTORY}/${esportsImagePath(kind, name)}`;
}

function symbolFor(name: string): { kind: SymbolKind; url: string } | undefined {
  const loreFile = LORE_CREST_FILES[name];
  if (loreFile !== undefined) return { kind: 'crest', url: fileUrl(CREST_BASE_URL, loreFile) };
  const logoUrl = esportsImageUrl('leagues', name) ?? esportsImageUrl('teams', name);
  if (logoUrl !== undefined) return { kind: 'crest', url: logoUrl };
  const photoUrl = esportsImageUrl('players', name);
  if (photoUrl !== undefined) return { kind: 'photo', url: photoUrl };
  return undefined;
}

/**
 * The image to show for each option of a text round, or undefined when the round shows none. It
 * is all or nothing: if only some options had an image, the cards without one would stand out
 * and hint at the answer.
 */
export function roundSymbols(round: Round): RoundSymbols | undefined {
  if (round.subject !== 'text') return undefined;
  const symbols = round.optionIds.map(symbolFor);
  const [first] = symbols;
  if (first === undefined || symbols.some((symbol) => symbol?.kind !== first.kind)) {
    return undefined;
  }
  if (first.kind === 'photo' && QUESTIONS_WITHOUT_PHOTOS.includes(round.questionId))
    return undefined;
  return {
    kind: first.kind,
    urls: Object.fromEntries(round.optionIds.map((id, index) => [id, symbols[index]?.url ?? ''])),
  };
}
