const CORRECT_SQUARE = '\u{1F7E9}';
const WRONG_SQUARE = '\u{1F7E5}';

/** Spoiler-free result text for sharing: a score line and one square per round. */
export function buildShareText(date: string, results: readonly boolean[], url?: string): string {
  const correct = results.filter(Boolean).length;
  const squares = results.map((ok) => (ok ? CORRECT_SQUARE : WRONG_SQUARE)).join('');
  const lines = [`DailyLeague ${date} ${String(correct)}/${String(results.length)}`, squares];
  if (url) lines.push(url);
  return lines.join('\n');
}
