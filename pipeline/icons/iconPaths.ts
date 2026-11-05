/**
 * Where the downloaded champion, item and ability icons live, below the site root. Every page sits
 * at the root, so the path works as an image address on any page and on any base path.
 */
export const ICON_DIRECTORY = 'images/icons';

export type IconKind = 'champions' | 'items' | 'abilities';

/** Named after our own id, which is stable across patches (Data Dragon's file names are not ours). */
export function iconPath(kind: IconKind, id: string): string {
  return `${ICON_DIRECTORY}/${kind}/${id}.png`;
}
