const CORRECT_SQUARE = '\u{1F7E9}';
const WRONG_SQUARE = '\u{1F7E5}';

/** Spoiler-free result text for sharing: a score line and one square per round. */
export function buildShareText(
  date: string,
  results: readonly boolean[],
  url?: string,
  modeName?: string,
): string {
  const correct = results.filter(Boolean).length;
  const squares = results.map((ok) => (ok ? CORRECT_SQUARE : WRONG_SQUARE)).join('');
  const title = `DailyLeague${modeName ? ` ${modeName}` : ''} ${date} ${String(correct)}/${String(results.length)}`;
  const lines = [title, squares];
  if (url) lines.push(url);
  return lines.join('\n');
}
