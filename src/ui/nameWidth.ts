/**
 * How wide the widest word of a round's option names is, in em, so the card CSS can shrink the
 * names until that word fits on one line (`--longest-word-em` in `game.css`). Breaking a word
 * like "thereisnourflevel" leaves one or two letters alone on the next line.
 *
 * An estimate from three letter widths, measured on both card fonts (Spectral 700, Inter 600):
 * real widths are within 10% of it, so the safety factor keeps any word from coming out wider.
 */
const WIDE_LETTERS = /[mwMW]/;
const CAPITAL_LETTERS = /[A-Z]/;
const NARROW_LETTERS = /[iljtfr'!.,:-]/;

const WIDE_LETTER_EM = 0.85;
const CAPITAL_LETTER_EM = 0.7;
const NARROW_LETTER_EM = 0.35;
const OTHER_LETTER_EM = 0.56;
const WIDTH_SAFETY_FACTOR = 1.1;

function letterWidthEm(letter: string): number {
  if (WIDE_LETTERS.test(letter)) return WIDE_LETTER_EM;
  if (CAPITAL_LETTERS.test(letter)) return CAPITAL_LETTER_EM;
  if (NARROW_LETTERS.test(letter)) return NARROW_LETTER_EM;
  return OTHER_LETTER_EM;
}

function wordWidthEm(word: string): number {
  let width = 0;
  for (const letter of word) width += letterWidthEm(letter);
  return width;
}

/** The estimated width of the widest word in any of the names, in em (0 for no words). */
export function longestWordEm(names: readonly string[]): number {
  const words = names.flatMap((name) => name.split(/\s+/));
  const widest = Math.max(0, ...words.map(wordWidthEm));
  return Math.round(widest * WIDTH_SAFETY_FACTOR * 100) / 100;
}
