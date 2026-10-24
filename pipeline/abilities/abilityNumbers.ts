import { wholeTemplateCall } from './wikitext';

/**
 * Reads the numbers in the wiki's ability templates. The wiki writes values per rank as
 * `{{ap|80 to 240}}` (rank 1 to max rank, evenly spaced), `{{ap|16 to 6 6}}` (with a rank
 * count), `{{ap|300|475|650}}` (each rank) or a plain number, sometimes as arithmetic such as
 * `35*2`. Only the max-rank value is used.
 */

const NUMBER = /^\d+(\.\d+)?|^\.\d+/;

/** Evaluates `+ - * /` and parentheses over plain numbers; undefined for anything else. */
export function evaluateArithmetic(expression: string): number | undefined {
  const source = expression.replace(/\s+/g, '');
  let position = 0;

  const parseFactor = (): number | undefined => {
    if (source[position] === '-') {
      position++;
      const value = parseFactor();
      return value === undefined ? undefined : -value;
    }
    if (source[position] === '(') {
      position++;
      const value = parseSum();
      if (source[position] !== ')') return undefined;
      position++;
      return value;
    }
    const match = NUMBER.exec(source.slice(position));
    if (!match) return undefined;
    position += match[0].length;
    return Number(match[0]);
  };
  const parseProduct = (): number | undefined => {
    let value = parseFactor();
    while (value !== undefined && (source[position] === '*' || source[position] === '/')) {
      const operator = source[position++];
      const right = parseFactor();
      value = right === undefined ? undefined : operator === '*' ? value * right : value / right;
    }
    return value;
  };
  const parseSum = (): number | undefined => {
    let value = parseProduct();
    while (value !== undefined && (source[position] === '+' || source[position] === '-')) {
      const operator = source[position++];
      const right = parseProduct();
      value = right === undefined ? undefined : operator === '+' ? value + right : value - right;
    }
    return value;
  };

  const value = parseSum();
  return position === source.length && value !== undefined && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * Strips display wrappers that do not change the number: `{{tt|value|tooltip}}` and
 * `{{fd|value}}` (decimal formatting).
 */
export function unwrapFormatting(text: string): string {
  for (const name of ['tt', 'fd']) {
    const args = wholeTemplateCall(text, name);
    if (args?.[0] !== undefined) return unwrapFormatting(args[0]);
  }
  return text.trim();
}

/** "80 to 240" or "16 to 6 6" (rank count last): the value after "to". */
const RANK_RANGE = /^(.+?) to (.+?)(?: \d+)?$/;

/** The max-rank value of a per-rank value; undefined if the text is not a clear number. */
export function maxRankValue(text: string): number | undefined {
  const unwrapped = unwrapFormatting(text);
  const args = wholeTemplateCall(unwrapped, 'ap');
  if (!args) return evaluateArithmetic(unwrapped);
  // Named arguments such as "round=2" only change the display.
  const ranks = args.filter((arg) => !arg.includes('='));
  const [only] = ranks;
  if (ranks.length !== 1 || only === undefined) return evaluateArithmetic(ranks.at(-1) ?? '');
  const range = RANK_RANGE.exec(only.trim());
  return evaluateArithmetic(range?.[2] ?? only);
}

/** The pieces of a value separated by spaces at the top level, e.g. a base and its ratios. */
export function topLevelPieces(text: string): string[] {
  const pieces: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === '{{' || pair === '}}') {
      depth += pair === '{{' ? 1 : -1;
      current += pair;
      i++;
    } else if (depth === 0 && /\s/.test(text[i] ?? '')) {
      if (current) pieces.push(current);
      current = '';
    } else {
      current += text.charAt(i);
    }
  }
  return current ? [...pieces, current] : pieces;
}

/** `{{as|(+ 50% AP)}}` -> "50% AP"; undefined for any other piece. */
export function ratioText(piece: string): string | undefined {
  const args = wholeTemplateCall(piece, 'as');
  const [inner] = args ?? [];
  if (args?.length !== 1 || inner === undefined) return undefined;
  return /^\(\+ ([\s\S]*)\)$/.exec(inner.trim())?.[1];
}

/** Index of the first `%` outside nested templates, or -1. */
function topLevelPercent(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === '{{' || pair === '}}') {
      depth += pair === '{{' ? 1 : -1;
      i++;
    } else if (depth === 0 && text[i] === '%') {
      return i;
    }
  }
  return -1;
}

/** Splits "{{ap|35 to 55}}% AP" into its max-rank amount and what it scales with. */
export function splitRatio(text: string): { amount: number; scalesWith: string } | undefined {
  const percent = topLevelPercent(text);
  if (percent === -1) return undefined;
  const amount = maxRankValue(text.slice(0, percent));
  const scalesWith = text.slice(percent + 1).trim();
  // A nested template in the scaling part ("(+ 3% per 100 AP)") is a formula, not one ratio.
  if (amount === undefined || scalesWith.includes('{{')) return undefined;
  return { amount, scalesWith };
}
