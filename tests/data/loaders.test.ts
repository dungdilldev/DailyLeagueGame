import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadGameData, type HttpFetcher } from '../../src/data/loaders';

const respond =
  (status: number, body?: unknown): HttpFetcher =>
  () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });

const realFile: unknown = JSON.parse(readFileSync('public/data/game-data.json', 'utf8'));

describe('loadGameData', () => {
  it('requests the data file relative to the base url and validates it', async () => {
    const urls: string[] = [];
    const fetcher: HttpFetcher = (url) => {
      urls.push(url);
      return respond(200, realFile)(url);
    };
    const data = await loadGameData(fetcher, './');
    expect(urls).toEqual(['./data/game-data.json']);
    expect(data.snapshots.length).toBeGreaterThan(0);
    expect(data.stats.length).toBeGreaterThan(5);
  });

  it('reports HTTP failures', async () => {
    await expect(loadGameData(respond(500), './')).rejects.toThrow(/HTTP 500/);
  });

  it('rejects malformed data instead of passing it on', async () => {
    await expect(loadGameData(respond(200, { stats: [], snapshots: [] }), './')).rejects.toThrow();
  });
});
