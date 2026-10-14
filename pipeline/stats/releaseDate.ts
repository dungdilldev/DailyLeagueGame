import { LEAGUE_WIKI_SOURCE, type StatDefinition } from './types';

/**
 * Release dates are stored as days since this date so they behave like any other number
 * (a later release is a higher value) and the relative-gap difficulty bands stay meaningful.
 * It is just before the first champions were released (2009-02-21).
 */
export const RELEASE_DATE_EPOCH = '2009-01-01';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSinceEpoch(isoDate: string): number {
  return Math.round(
    (Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${RELEASE_DATE_EPOCH}T00:00:00Z`)) /
      MS_PER_DAY,
  );
}

export const releaseDate: StatDefinition = {
  id: 'releaseDate',
  label: 'Release date',
  question: 'Which champion was released most recently?',
  source: LEAGUE_WIKI_SOURCE,
  format: { kind: 'date', epoch: RELEASE_DATE_EPOCH },
  extract: ({ wiki }) => (wiki?.releaseDate ? daysSinceEpoch(wiki.releaseDate) : undefined),
};
