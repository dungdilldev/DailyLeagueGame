import type { WikiItem } from '../sources/leagueWikiItems';

const PERCENT = 100;
const TENTHS = 10;

/**
 * Gold efficiency from stats alone: what the item's stats would cost if bought one by one,
 * divided by the item's price, as a percentage. Passives and active effects are not valued,
 * so items built around them score low. Undefined when the number would be wrong: a stat
 * without a known gold value, or one that is not a plain number.
 */
export function goldEfficiency(
  item: Pick<WikiItem, 'stats' | 'unresolvedStats'>,
  goldValues: Readonly<Record<string, number>>,
  price: number,
): number | undefined {
  if (price <= 0 || item.unresolvedStats.length > 0) return undefined;

  let statsValue = 0;
  for (const [stat, amount] of Object.entries(item.stats)) {
    const goldPerPoint = goldValues[stat];
    if (goldPerPoint === undefined) return undefined;
    statsValue += amount * goldPerPoint;
  }
  if (statsValue === 0) return undefined;
  return Math.round((statsValue / price) * PERCENT * TENTHS) / TENTHS;
}
