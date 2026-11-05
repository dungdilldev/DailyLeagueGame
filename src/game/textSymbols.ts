import { CREST_FILES, CREST_IMAGE_DIRECTORY, crestImagePath } from '../data/crestImages';
import {
  ESPORTS_IMAGE_DIRECTORY,
  esportsImagePath,
  esportsImages,
  type EsportsImageKind,
} from '../data/esportsImages';
import type { Round } from './puzzle';

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

/**
 * Downloaded esports image, if there is one for this name. Image addresses are relative: every
 * page sits at the site root, where the images folder is.
 */
function esportsImageUrl(kind: EsportsImageKind, name: string): string | undefined {
  if (!(name in esportsImages[kind])) return undefined;
  return `${ESPORTS_IMAGE_DIRECTORY}/${esportsImagePath(kind, name)}`;
}

function symbolFor(name: string): { kind: SymbolKind; url: string } | undefined {
  const crestFile = CREST_FILES[name];
  if (crestFile !== undefined) {
    return { kind: 'crest', url: `${CREST_IMAGE_DIRECTORY}/${crestImagePath(crestFile)}` };
  }
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
  // A round with a clue asks the player to recognise it; logos on the cards would answer it.
  if (round.subject !== 'text' || round.clue !== undefined) return undefined;
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

/** The image shown with the question of a clue round: the answer's team logo. */
export function clueImageUrl(round: Round): string | undefined {
  return round.clue === 'teamLogo' ? esportsImageUrl('teams', round.answerId) : undefined;
}
