import type { StatInput } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25;
/**
 * A champion released a few weeks ago would otherwise get a huge rate from one skin or one
 * patch. Everyone younger than this counts as this old.
 */
export const MIN_AGE_YEARS = 1;
/** Two decimals keep the values readable and the data small. */
const DECIMAL_FACTOR = 100;

type InputWithoutReference = Omit<StatInput, 'referenceDate'>;

/**
 * The date champion ages are measured up to: the newest release in the data, not today. A
 * clock would change every value every day and make a new data snapshot every day; this only
 * moves when a champion is released, which changes the data anyway.
 */
export function latestReleaseDate(inputs: readonly InputWithoutReference[]): string | undefined {
  const dates = inputs.flatMap((input) =>
    input.wiki?.releaseDate ? [input.wiki.releaseDate] : [],
  );
  // ISO dates compare correctly as plain strings.
  return dates.reduce<string | undefined>(
    (latest, date) => (latest === undefined || date > latest ? date : latest),
    undefined,
  );
}

export function withReferenceDate(inputs: readonly InputWithoutReference[]): StatInput[] {
  const referenceDate = latestReleaseDate(inputs);
  return inputs.map((input) => ({ ...input, referenceDate }));
}

/**
 * `count` per year of the champion's age at `referenceDate` (at least `MIN_AGE_YEARS`).
 * Undefined when the count or either date is unknown.
 */
export function perYear(
  count: number | undefined,
  releaseDate: string | undefined,
  referenceDate: string | undefined,
): number | undefined {
  if (count === undefined || !releaseDate || !referenceDate) return undefined;
  const days = (Date.parse(referenceDate) - Date.parse(releaseDate)) / MS_PER_DAY;
  const years = Math.max(days / DAYS_PER_YEAR, MIN_AGE_YEARS);
  return Math.round((count / years) * DECIMAL_FACTOR) / DECIMAL_FACTOR;
}
