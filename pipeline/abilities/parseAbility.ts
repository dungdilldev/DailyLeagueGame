import {
  maxRankValue,
  ratioText,
  splitRatio,
  topLevelPieces,
  unwrapFormatting,
} from './abilityNumbers';
import { substituteVariables, templateCalls, templateField } from './wikitext';

/** What an ability's damage scales with; only these are asked about. */
export type RatioKind = 'ap' | 'ad' | 'bonusAd';

/** An ability's champion damage at max rank: the flat part and its ratios in percent. */
export interface AbilityDamage {
  base: number;
  ratios: Partial<Record<RatioKind, number>>;
}

/** The numbers of one ability from its wiki data template, all at max rank. */
export interface WikiAbility {
  name: string;
  /** Absent unless the ability has exactly one champion damage line that could be read fully. */
  damage?: AbilityDamage;
  /** Seconds; absent for abilities with charges (their cooldown is only the time between casts). */
  cooldown?: number;
  /** Absent unless the ability costs mana and nothing else. */
  manaCost?: number;
}

/** The template starts with `{{{{{1<noinclude>|Ability data</noinclude>}}}|<ability name>|`. */
const ABILITY_NAME = /\{\{\{\{\{1<noinclude>\|Ability data<\/noinclude>\}\}\}\|([^|{}]+)\|/;

/**
 * Lines that are about damage to minions, monsters or secondary targets. They do not make the
 * champion damage ambiguous, so they are ignored; lines such as "Damage Reduction" are not damage.
 */
const NOT_CHAMPION_DAMAGE = /reduction|reduced|minion|monster|non-champion|structure|modifier/i;
const DAMAGE_LINE = /damage/i;
/** Only these labels are one clear number; "Bonus", "Maximum" or "Per Tick" lines are not. */
const CLEAR_DAMAGE_LABEL = /^(total )?(magic|physical|true) damage$/i;

/** Keyed by the scaling text without its bold markup ("'''bonus''' AD"). */
const RATIO_KINDS: Readonly<Record<string, RatioKind>> = {
  AP: 'ap',
  AD: 'ad',
  'bonus AD': 'bonusAd',
};

/** What a ratio scales with, if it is one the questions ask about. */
function ratioKind(scalesWith: string): RatioKind | undefined {
  return RATIO_KINDS[scalesWith.replace(/'''/g, '')];
}

/** The `{{st|label|value|label|value...}}` lines of the leveling field, as label-value pairs. */
function levelingLines(leveling: string): [string, string][] {
  return templateCalls(leveling, 'st').flatMap((args) =>
    args.flatMap((label, i): [string, string][] => {
      const value = args[i + 1];
      return i % 2 === 0 && value !== undefined ? [[unwrapFormatting(label), value.trim()]] : [];
    }),
  );
}

/**
 * Reads "{{ap|35 to 135}} {{as|(+ 50% AP)}} ...". Ratios to anything else (health, mana, a
 * target's health) are allowed but not kept; any piece that is not a plain ratio makes the whole
 * line unreadable, so a formula is never mistaken for a simple ratio.
 */
export function parseDamageLine(value: string): AbilityDamage | undefined {
  const [basePiece, ...ratioPieces] = topLevelPieces(value);
  const base = basePiece === undefined ? undefined : maxRankValue(basePiece);
  if (base === undefined || base <= 0) return undefined;

  const ratios: Partial<Record<RatioKind, number>> = {};
  for (const piece of ratioPieces) {
    const text = ratioText(piece);
    const ratio = text === undefined ? undefined : splitRatio(text);
    if (!ratio) return undefined;
    const kind = ratioKind(ratio.scalesWith);
    if (kind === undefined) continue;
    if (ratios[kind] !== undefined) return undefined;
    ratios[kind] = ratio.amount;
  }
  return { base, ratios };
}

function parseDamage(text: string): AbilityDamage | undefined {
  const lines = levelingLines(templateField(text, 'leveling') ?? '').filter(
    ([label]) => DAMAGE_LINE.test(label) && !NOT_CHAMPION_DAMAGE.test(label),
  );
  const [line] = lines;
  if (lines.length !== 1 || !line || !CLEAR_DAMAGE_LABEL.test(line[0])) return undefined;
  return parseDamageLine(line[1]);
}

function parseCooldown(text: string): number | undefined {
  if (templateField(text, 'recharge')) return undefined;
  const cooldown = maxRankValue(templateField(text, 'cooldown') ?? '');
  return cooldown !== undefined && cooldown > 0 ? cooldown : undefined;
}

function parseManaCost(text: string): number | undefined {
  if (!/^mana$/i.test(templateField(text, 'costtype') ?? '')) return undefined;
  const cost = maxRankValue(templateField(text, 'cost') ?? '');
  return cost !== undefined && cost > 0 ? cost : undefined;
}

/** Undefined if the text is not an ability data template. */
export function parseAbility(templateText: string): WikiAbility | undefined {
  const text = substituteVariables(templateText);
  const name = ABILITY_NAME.exec(text)?.[1]?.trim();
  if (!name) return undefined;
  const damage = parseDamage(text);
  const cooldown = parseCooldown(text);
  const manaCost = parseManaCost(text);
  return {
    name,
    ...(damage && { damage }),
    ...(cooldown !== undefined && { cooldown }),
    ...(manaCost !== undefined && { manaCost }),
  };
}
