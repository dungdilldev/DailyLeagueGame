/**
 * Reads the data tables the LoL Wiki publishes as Lua modules (`return { ["key"] = value, ... }`).
 * Supports the subset those modules use: nested tables, strings, numbers, booleans, nil and
 * comments. Anything else (functions, expressions, concatenation) is rejected with the position.
 */

type LuaValue = string | number | boolean | null | LuaValue[] | { [key: string]: LuaValue };

const NUMBER_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*/;
const ESCAPES: Readonly<Record<string, string>> = { n: '\n', t: '\t', r: '\r', '\\': '\\' };

class LuaParser {
  private position = 0;

  constructor(private readonly source: string) {}

  parseChunk(): LuaValue {
    this.skipSpace();
    if (this.source.startsWith('return', this.position)) this.position += 'return'.length;
    const value = this.parseValue();
    this.skipSpace();
    if (this.position < this.source.length) this.fail('Unexpected content after the table');
    return value;
  }

  private fail(message: string): never {
    const near = this.source.slice(this.position, this.position + 30).replaceAll('\n', ' ');
    throw new Error(`Lua parse error at ${String(this.position)}: ${message} (near "${near}")`);
  }

  private skipSpace(): void {
    for (;;) {
      const char = this.source[this.position];
      if (char !== undefined && /\s/.test(char)) {
        this.position++;
      } else if (this.source.startsWith('--[[', this.position)) {
        const end = this.source.indexOf(']]', this.position);
        if (end === -1) this.fail('Unterminated block comment');
        this.position = end + 2;
      } else if (this.source.startsWith('--', this.position)) {
        const end = this.source.indexOf('\n', this.position);
        this.position = end === -1 ? this.source.length : end + 1;
      } else {
        return;
      }
    }
  }

  private parseValue(): LuaValue {
    this.skipSpace();
    const char = this.source[this.position];
    if (char === '{') return this.parseTable();
    if (char === '"' || char === "'") return this.parseString(char);

    const rest = this.source.slice(this.position);
    const number = NUMBER_PATTERN.exec(rest);
    if (number) {
      this.position += number[0].length;
      return Number(number[0]);
    }
    const word = NAME_PATTERN.exec(rest)?.[0];
    if (word === 'true' || word === 'false') {
      this.position += word.length;
      return word === 'true';
    }
    if (word === 'nil') {
      this.position += word.length;
      return null;
    }
    return this.fail('Unsupported value');
  }

  private parseString(quote: string): string {
    this.position++;
    let text = '';
    for (;;) {
      const char = this.source[this.position++];
      if (char === undefined) this.fail('Unterminated string');
      if (char === quote) return text;
      if (char === '\\') {
        const escaped = this.source[this.position++] ?? '';
        text += ESCAPES[escaped] ?? escaped;
      } else {
        text += char;
      }
    }
  }

  private parseKey(): string | undefined {
    this.skipSpace();
    if (this.source[this.position] === '[') {
      this.position++;
      const key = this.parseValue();
      this.skipSpace();
      if (this.source[this.position] !== ']') this.fail('Expected ]');
      this.position++;
      this.expectEquals();
      if (typeof key !== 'string' && typeof key !== 'number')
        this.fail('Table keys must be strings or numbers');
      return String(key);
    }
    const name = NAME_PATTERN.exec(this.source.slice(this.position))?.[0];
    if (name === undefined || name === 'true' || name === 'false' || name === 'nil')
      return undefined;

    const afterName = this.position + name.length;
    const saved = this.position;
    this.position = afterName;
    this.skipSpace();
    if (this.source[this.position] === '=' && this.source[this.position + 1] !== '=') {
      this.position++;
      return name;
    }
    this.position = saved;
    return undefined;
  }

  private expectEquals(): void {
    this.skipSpace();
    if (this.source[this.position] !== '=') this.fail('Expected =');
    this.position++;
  }

  private parseTable(): LuaValue {
    this.position++;
    const keyed: Record<string, LuaValue> = {};
    const positional: LuaValue[] = [];

    for (;;) {
      this.skipSpace();
      if (this.source[this.position] === '}') {
        this.position++;
        break;
      }
      const key = this.parseKey();
      const value = this.parseValue();
      if (key === undefined) positional.push(value);
      else keyed[key] = value;

      this.skipSpace();
      const separator = this.source[this.position];
      if (separator === ',' || separator === ';') this.position++;
      else if (separator !== '}') this.fail('Expected , or }');
    }

    if (Object.keys(keyed).length === 0) return positional;
    positional.forEach((value, index) => {
      keyed[String(index + 1)] = value;
    });
    return keyed;
  }
}

/** Parses a Lua module's returned table into plain JavaScript values. */
export function parseLuaTable(source: string): unknown {
  return new LuaParser(source).parseChunk();
}
