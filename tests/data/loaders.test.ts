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

const readData = (name: string): unknown =>
  JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8'));
const realChampions = readData('champions');
const realItems = readData('items');

/** Answers each data file with its real content. */
const realFiles: HttpFetcher = (url) =>
  respond(200, url.endsWith('champions.json') ? realChampions : realItems)(url);

describe('loadGameData', () => {
  it('requests both data files relative to the base url and validates them', async () => {
    const urls: string[] = [];
    const fetcher: HttpFetcher = (url) => {
      urls.push(url);
      return realFiles(url);
    };
    const data = await loadGameData(fetcher, './');
    expect(urls.sort()).toEqual(['./data/champions.json', './data/items.json']);
    expect(data.champions.snapshots.length).toBeGreaterThan(0);
    expect(data.items.snapshots.length).toBeGreaterThan(0);
    expect(data.questions.length).toBeGreaterThan(5);
  });

  it('ties each question to its stat and subject', async () => {
    const { questions } = await loadGameData(realFiles, './');
    const itemCost = questions.find((question) => question.stat === 'itemCost');
    expect(itemCost?.subject).toBe('item');
    expect(itemCost?.statMeta.label).toBe('Item cost');
  });

  it('reports HTTP failures', async () => {
    await expect(loadGameData(respond(500), './')).rejects.toThrow(/HTTP 500/);
  });

  it('rejects malformed data instead of passing it on', async () => {
    await expect(loadGameData(respond(200, { stats: [], snapshots: [] }), './')).rejects.toThrow();
  });

  it('rejects questions about a stat that does not exist', async () => {
    const questions = { questions: [{ id: 'q', stat: 'nope', question: 'Which champion?' }] };
    await expect(loadGameData(realFiles, './', questions)).rejects.toThrow(/unknown stat "nope"/);
  });
});
