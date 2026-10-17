import { describe, expect, it } from 'vitest';
import {
  latestReleaseDate,
  MIN_AGE_YEARS,
  perYear,
  withReferenceDate,
} from '../../pipeline/stats/perYear';
import { patchesPerYear } from '../../pipeline/stats/patchesPerYear';
import { countSkins } from '../../pipeline/stats/skinCount';
import { skinsPerYear } from '../../pipeline/stats/skinsPerYear';
import { makeDetail, makeInput, makeWiki } from './fixtures';

describe('perYear', () => {
  it('divides the count by the champion age in years', () => {
    // 10 years minus 2 days of leap-year slack: 3653 days = 10.0013 years.
    expect(perYear(20, '2010-01-01', '2020-01-01')).toBe(2);
  });

  it('rounds to two decimals', () => {
    expect(perYear(1, '2010-01-01', '2013-01-01')).toBe(0.33);
  });

  it('treats a champion younger than a year as a year old, so a new one does not win on one skin', () => {
    expect(perYear(3, '2025-12-01', '2026-01-01')).toBe(3 / MIN_AGE_YEARS);
    expect(perYear(3, '2026-01-01', '2026-01-01')).toBe(3);
  });

  it('is undefined when the count or a date is unknown', () => {
    expect(perYear(undefined, '2010-01-01', '2020-01-01')).toBeUndefined();
    expect(perYear(5, undefined, '2020-01-01')).toBeUndefined();
    expect(perYear(5, '2010-01-01', undefined)).toBeUndefined();
  });

  it('gives a younger champion a higher rate for the same count', () => {
    const old = perYear(10, '2010-01-01', '2020-01-01') ?? 0;
    const young = perYear(10, '2018-01-01', '2020-01-01') ?? 0;
    expect(young).toBeGreaterThan(old);
  });
});

describe('latestReleaseDate and withReferenceDate', () => {
  const input = (id: string, releaseDate: string | undefined) => {
    const full = makeInput(id, { wiki: releaseDate ? makeWiki(id, { releaseDate }) : undefined });
    return {
      summary: full.summary,
      detail: full.detail,
      wiki: full.wiki,
      patchCount: full.patchCount,
    };
  };

  it('is the newest release in the data, not today, so values only move with new champions', () => {
    const inputs = [input('A', '2010-01-01'), input('B', '2024-07-17'), input('C', '2019-05-05')];
    expect(latestReleaseDate(inputs)).toBe('2024-07-17');
    expect(withReferenceDate(inputs).every((each) => each.referenceDate === '2024-07-17')).toBe(
      true,
    );
  });

  it('ignores champions the wiki has no date for, and is undefined if none has one', () => {
    expect(latestReleaseDate([input('A', undefined), input('B', '2012-02-02')])).toBe('2012-02-02');
    expect(latestReleaseDate([input('A', undefined)])).toBeUndefined();
  });
});

describe('skinsPerYear and patchesPerYear', () => {
  const base = makeInput('Ahri', {
    wiki: makeWiki('Ahri', { releaseDate: '2010-01-01' }),
    detail: makeDetail('Ahri', {
      skins: [
        { num: 0, name: 'default' },
        { num: 1, name: 'Dynasty Ahri' },
        { num: 2, name: 'Popstar Ahri' },
        { num: 3, name: 'Popstar Ahri (Ruby)' },
      ],
    }),
    patchCount: 40,
    referenceDate: '2020-01-01',
  });

  it('counts the same skins as the skin count stat', () => {
    expect(countSkins(base.detail)).toBe(2);
  });

  it('skins per year uses the skins a player can buy and the champion age', () => {
    expect(skinsPerYear.extract(base)).toBe(0.2);
  });

  it('patch changes per year uses the number of patches with changes', () => {
    expect(patchesPerYear.extract(base)).toBe(4);
  });

  it('are unavailable without a release date or, for patches, without a patch history', () => {
    expect(skinsPerYear.extract({ ...base, wiki: undefined })).toBeUndefined();
    expect(patchesPerYear.extract({ ...base, patchCount: undefined })).toBeUndefined();
    expect(skinsPerYear.extract({ ...base, referenceDate: undefined })).toBeUndefined();
  });
});
