import { describe, expect, it } from 'vitest';
import {
  evaluateArithmetic,
  maxRankValue,
  ratioText,
  splitRatio,
  topLevelPieces,
  unwrapFormatting,
} from '../../pipeline/abilities/abilityNumbers';
import {
  splitTopLevel,
  substituteVariables,
  templateCalls,
  templateField,
  wholeTemplateCall,
} from '../../pipeline/abilities/wikitext';

describe('wikitext helpers', () => {
  it('splits at top-level pipes only', () => {
    expect(splitTopLevel('a|{{ap|1|2}}|[[File:x.png|20px]]|b')).toEqual([
      'a',
      '{{ap|1|2}}',
      '[[File:x.png|20px]]',
      'b',
    ]);
  });

  it('finds every call of a template, including nested arguments', () => {
    const text = '{{st|Magic Damage|{{ap|80 to 240}}}} and {{st|Slow|{{ap|20 to 40}}%}}';
    expect(templateCalls(text, 'st')).toEqual([
      ['Magic Damage', '{{ap|80 to 240}}'],
      ['Slow', '{{ap|20 to 40}}%'],
    ]);
  });

  it('reads a call only when it is the whole text', () => {
    expect(wholeTemplateCall('{{tt|7|Starts on cast}}', 'tt')).toEqual(['7', 'Starts on cast']);
    expect(wholeTemplateCall('{{tt|7|x}} + 2', 'tt')).toBeUndefined();
    expect(wholeTemplateCall('7', 'tt')).toBeUndefined();
  });

  it('substitutes variables defined at the top of a template', () => {
    const text =
      '{{#vardefine:b1|10}}{{#vardefine: b5 |70}}|leveling = {{ap|{{#var:b1}} to {{#var:b5}}}}';
    expect(substituteVariables(text)).toContain('{{ap|10 to 70}}');
    expect(substituteVariables('{{#var:unknown}}')).toBe('{{#var:unknown}}');
  });

  it('reads a field up to the next field, across lines and nested templates', () => {
    const text = '{{X|Name\n|cooldown = {{tt|{{ap|9 to 5}}|Starts\npost-effect}}\n|cost = 60\n}}';
    expect(templateField(text, 'cooldown')).toBe('{{tt|{{ap|9 to 5}}|Starts\npost-effect}}');
    expect(templateField(text, 'cost')).toBe('60');
    expect(templateField(text, 'range')).toBeUndefined();
  });
});

describe('evaluateArithmetic', () => {
  it.each([
    ['7', 7],
    ['0.25', 0.25],
    ['35*2', 70],
    ['80/10', 8],
    ['((45+(105-45)*(3/4))/8)*26', 292.5],
    ['1 + 2 * 3', 7],
  ])('%s = %d', (expression, value) => {
    expect(evaluateArithmetic(expression)).toBeCloseTo(value);
  });

  it.each(['', 'Global', '5 per second', '1/0', '(1+2', '2^3'])('rejects %j', (expression) => {
    expect(evaluateArithmetic(expression)).toBeUndefined();
  });
});

describe('maxRankValue', () => {
  it.each([
    ['7', 7],
    ['{{ap|80 to 240}}', 240],
    ['{{ap|16 to 6 6}}', 6],
    ['{{ap|300|475|650}}', 650],
    ['{{ap|35*2 to 135*2}}', 270],
    ['{{ap|65/7 to 205/7|round=2}}', 205 / 7],
    ['{{tt|{{ap|140 to 100}}|Starts after first cast}}', 100],
    ['{{fd|1.5}}', 1.5],
  ])('%s -> %d', (text, value) => {
    expect(maxRankValue(text)).toBeCloseTo(value);
  });

  it.each(['{{pp|4-0.75*(x-1)|0 to 3 by 1}}', '{{ap|{{#var:b1}} to {{#var:b5}}}}', 'Global', ''])(
    'gives nothing for %j',
    (text) => {
      expect(maxRankValue(text)).toBeUndefined();
    },
  );
});

describe('ratio pieces', () => {
  it('splits a value into its base and ratio pieces', () => {
    expect(topLevelPieces("{{ap|45 to 165}} {{as|(+ 70% '''bonus''' AD)}}")).toEqual([
      '{{ap|45 to 165}}',
      "{{as|(+ 70% '''bonus''' AD)}}",
    ]);
  });

  it('reads the inside of a ratio piece', () => {
    expect(ratioText('{{as|(+ 50% AP)}}')).toBe('50% AP');
    expect(ratioText('{{as|magic damage}}')).toBeUndefined();
    expect(ratioText('{{as|(+ 5% AP)|ap}}')).toBeUndefined();
  });

  it('splits a ratio into its max-rank amount and what it scales with', () => {
    expect(splitRatio('{{ap|35 to 55}}% AP')).toEqual({ amount: 55, scalesWith: 'AP' });
    expect(splitRatio("{{fd|2.5}}% of '''Braum's''' '''maximum''' health")).toEqual({
      amount: 2.5,
      scalesWith: "of '''Braum's''' '''maximum''' health",
    });
  });

  it('rejects ratios that are formulas', () => {
    expect(
      splitRatio("4% {{as|(+ 3% per 100 AP)}} of target's '''current''' health"),
    ).toBeUndefined();
    expect(splitRatio('{{#var:EApS}}% AP')).toBeUndefined();
  });

  it('unwraps tooltips and decimal formatting', () => {
    expect(unwrapFormatting('{{tt|{{fd|0.5}}|note}}')).toBe('0.5');
    expect(unwrapFormatting(' Physical Damage ')).toBe('Physical Damage');
  });
});
