/**
 * Just enough wikitext reading for the wiki's ability data templates: fields, nested template
 * calls and variables. Anything this cannot read leaves a value out rather than guessing.
 */

const OPEN = '{{';
const CLOSE = '}}';
const LINK_OPEN = '[[';
const LINK_CLOSE = ']]';

/** Index just past the `}}` that closes the template opened at `start`, or -1 if unbalanced. */
function closingIndex(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length - 1; i++) {
    if (text.startsWith(OPEN, i)) {
      depth++;
      i++;
    } else if (text.startsWith(CLOSE, i)) {
      depth--;
      i++;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Splits at `|` characters that are not inside a nested template or link. */
export function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const pair = body.slice(i, i + 2);
    if (pair === OPEN || pair === LINK_OPEN || pair === CLOSE || pair === LINK_CLOSE) {
      depth += pair === OPEN || pair === LINK_OPEN ? 1 : -1;
      current += pair;
      i++;
    } else if (depth === 0 && body[i] === '|') {
      parts.push(current);
      current = '';
    } else {
      current += body.charAt(i);
    }
  }
  return [...parts, current];
}

/** The arguments of every `{{name|...}}` call in the text, in order. */
export function templateCalls(text: string, name: string): string[][] {
  const calls: string[][] = [];
  const opening = `${OPEN}${name}|`;
  let start = text.indexOf(opening);
  while (start !== -1) {
    const end = closingIndex(text, start);
    if (end === -1) break;
    calls.push(splitTopLevel(text.slice(start + opening.length, end - CLOSE.length)));
    start = text.indexOf(opening, end);
  }
  return calls;
}

/** If the whole text is one `{{name|...}}` call, its arguments. */
export function wholeTemplateCall(text: string, name: string): string[] | undefined {
  const trimmed = text.trim();
  if (!trimmed.startsWith(`${OPEN}${name}|`)) return undefined;
  return closingIndex(trimmed, 0) === trimmed.length ? templateCalls(trimmed, name)[0] : undefined;
}

/**
 * Replaces `{{#var:name}}` with the value set by `{{#vardefine:name|value}}`. Some templates
 * define their numbers once at the top this way.
 */
export function substituteVariables(text: string): string {
  const values = new Map(
    [...text.matchAll(/\{\{#vardefine:([^|{}]+)\|([^{}]*)\}\}/g)].map(
      ([, name = '', value = '']) => [name.trim(), value.trim()],
    ),
  );
  return text.replace(/\{\{#var:([^|{}]+)\}\}/g, (call, name: string) => {
    return values.get(name.trim()) ?? call;
  });
}

/**
 * The value of a top-level `|name = value` field of a template, which may span several lines
 * and contain nested templates. Undefined if the field is absent.
 */
export function templateField(text: string, name: string): string | undefined {
  const start = new RegExp(String.raw`^\|\s*${name}\s*=`, 'm').exec(text);
  if (!start) return undefined;
  let depth = 0;
  let i = start.index + start[0].length;
  const valueStart = i;
  for (; i < text.length; i++) {
    if (text.startsWith(OPEN, i)) {
      depth++;
      i++;
    } else if (text.startsWith(CLOSE, i)) {
      if (depth === 0) break;
      depth--;
      i++;
    } else if (depth === 0 && text[i] === '\n' && text[i + 1] === '|') {
      break;
    }
  }
  return text.slice(valueStart, i).trim();
}
