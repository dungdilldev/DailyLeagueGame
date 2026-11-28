const SQUARES = {
  standard: { correct: '\u{1F7E9}', wrong: '\u{1F7E5}' },
  // Blue and orange, the colours of the game in colorblind mode.
  colorblind: { correct: '\u{1F7E6}', wrong: '\u{1F7E7}' },
} as const;

export type SharePalette = keyof typeof SQUARES;

/** Spoiler-free result text for sharing: a score line and one square per round. */
const GAME_NAME = "Summoner's Quiz";

export function buildShareText(
  date: string,
  results: readonly boolean[],
  url?: string,
  modeName?: string,
  palette: SharePalette = 'standard',
): string {
  const correct = results.filter(Boolean).length;
  const { correct: correctSquare, wrong: wrongSquare } = SQUARES[palette];
  const squares = results.map((ok) => (ok ? correctSquare : wrongSquare)).join('');
  const title = `${GAME_NAME}${modeName ? ` ${modeName}` : ''} ${date} ${String(correct)}/${String(results.length)}`;
  const lines = [title, squares];
  if (url) lines.push(url);
  return lines.join('\n');
}
