import { describe, expect, it } from 'vitest';
import {
  fetchChampionDetail,
  fetchChampionSummaries,
  fetchLatestVersion,
  type JsonFetcher,
} from '../../pipeline/sources/dataDragon';

const fakeFetcher =
  (responses: Record<string, unknown>): JsonFetcher =>
  (url) => {
    if (!(url in responses)) return Promise.reject(new Error(`Unexpected URL ${url}`));
    return Promise.resolve(responses[url]);
  };

const BASE = 'https://ddragon.leagueoflegends.com';

describe('Data Dragon source', () => {
  it('returns the first (newest) version', async () => {
    const fetcher = fakeFetcher({ [`${BASE}/api/versions.json`]: ['16.20.1', '16.19.1'] });
    await expect(fetchLatestVersion(fetcher)).resolves.toBe('16.20.1');
  });

  it('rejects an empty version list', async () => {
    const fetcher = fakeFetcher({ [`${BASE}/api/versions.json`]: [] });
    await expect(fetchLatestVersion(fetcher)).rejects.toThrow();
  });

  it('parses champion summaries and ignores unknown fields', async () => {
    const fetcher = fakeFetcher({
      [`${BASE}/cdn/1.0/data/en_US/champion.json`]: {
        data: {
          Ahri: {
            id: 'Ahri',
            key: '103',
            name: 'Ahri',
            title: 'the Nine-Tailed Fox',
            tags: ['Mage'],
            image: { full: 'Ahri.png' },
            blurb: 'ignored',
          },
        },
      },
    });
    const summaries = await fetchChampionSummaries(fetcher, '1.0');
    expect(summaries.map((s) => s.id)).toEqual(['Ahri']);
  });

  it('fails when a response does not match the expected shape', async () => {
    const fetcher = fakeFetcher({
      [`${BASE}/cdn/1.0/data/en_US/champion.json`]: { data: { X: {} } },
    });
    await expect(fetchChampionSummaries(fetcher, '1.0')).rejects.toThrow();
  });

  it('fails when the requested champion is absent from the detail response', async () => {
    const fetcher = fakeFetcher({
      [`${BASE}/cdn/1.0/data/en_US/champion/Ahri.json`]: { data: {} },
    });
    await expect(fetchChampionDetail(fetcher, '1.0', 'Ahri')).rejects.toThrow(/missing/);
  });
});
