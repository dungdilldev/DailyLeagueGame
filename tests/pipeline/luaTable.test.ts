import { describe, expect, it } from 'vitest';
import { parseLuaTable } from '../../pipeline/sources/luaTable';

describe('parseLuaTable', () => {
  it('reads keyed tables, nested tables, numbers, strings and booleans', () => {
    const lua = `-- comment
return {
  ["Infinity Edge"] = {
    ["id"] = 3031,
    ["stats"] = { ["ad"] = 75, ["crit"] = 0.25 },
    ["modes"] = { ["aram"] = true, ["arena"] = false },
    ["recipe"] = {"B. F. Sword", 'Pickaxe'},
  },
}`;
    expect(parseLuaTable(lua)).toEqual({
      'Infinity Edge': {
        id: 3031,
        stats: { ad: 75, crit: 0.25 },
        modes: { aram: true, arena: false },
        recipe: ['B. F. Sword', 'Pickaxe'],
      },
    });
  });

  it('supports bare names as keys, nil, negative numbers and ; separators', () => {
    expect(parseLuaTable('return { a = 1; b = -2.5, c = nil }')).toEqual({
      a: 1,
      b: -2.5,
      c: null,
    });
  });

  it('skips line and block comments anywhere, including after values', () => {
    const lua = `--[[ header
      block ]]
    return { ["a"] = 1, -- trailing
      --[[ inner ]] ["b"] = 2 }`;
    expect(parseLuaTable(lua)).toEqual({ a: 1, b: 2 });
  });

  it('handles escapes and quotes inside strings', () => {
    expect(parseLuaTable(String.raw`return { ["s"] = "say \"hi\"\n", ["t"] = 'it\'s' }`)).toEqual({
      s: 'say "hi"\n',
      t: "it's",
    });
  });

  it('reads an empty table and a list of values', () => {
    expect(parseLuaTable('return {}')).toEqual([]);
    expect(parseLuaTable('return { 1, 2, 3 }')).toEqual([1, 2, 3]);
  });

  it('reads a table without the return keyword', () => {
    expect(parseLuaTable('{ ["a"] = 1 }')).toEqual({ a: 1 });
  });

  it('rejects things it cannot represent, saying where', () => {
    expect(() => parseLuaTable('return { ["a"] = 1 + 2 }')).toThrow(/Lua parse error/);
    expect(() => parseLuaTable('return { ["a"] = foo() }')).toThrow(/Unsupported value/);
    expect(() => parseLuaTable('return { ["a"] = "unterminated }')).toThrow(/Unterminated string/);
    expect(() => parseLuaTable('return { ["a"] = 1 } extra')).toThrow(/after the table/);
  });
});
