import { describe, expect, it } from 'vitest';
import { countPatchEntries, fetchPatchCounts } from '../../pipeline/sources/leagueWikiPatchHistory';

const history = (patches: number, extra = '') =>
  `{{LoL navigation}}\n== Current version ==\n${Array.from(
    { length: patches },
    (_, i) => `;[[V26.${String(i)}]]\n* {{ai|Q|X}}\n** Damage increased.\n`,
  ).join('\n')}${extra}\n==See also==\n`;

describe('countPatchEntries', () => {
  it('counts one entry per patch heading line', () => {
    expect(countPatchEntries(history(3))).toBe(3);
  });

  it('counts hotfixes and links with a label, and ignores other lines', () => {
    const text = history(
      2,
      ';[[V25.24#December 17th Hotfix|V25.24]] - December 17th Hotfix\n; not a patch link\n* ;[[V1]] in a list',
    );
    expect(countPatchEntries(text)).toBe(3);
  });

  it('is zero for a page without entries', () => {
    expect(countPatchEntries('#REDIRECT [[Nunu/Patch history]]')).toBe(0);
  });
});

interface FakePage {
  title: string;
  content?: string;
}

function apiResponse(
  pages: FakePage[],
  maps: { normalized?: [string, string][]; redirects?: [string, string][] } = {},
) {
  const toList = (entries?: [string, string][]) => entries?.map(([from, to]) => ({ from, to }));
  return JSON.stringify({
    query: {
      pages: pages.map((page) =>
        page.content === undefined
          ? { title: page.title, missing: true }
          : { title: page.title, revisions: [{ slots: { main: { content: page.content } } }] },
      ),
      normalized: toList(maps.normalized),
      redirects: toList(maps.redirects),
    },
  });
}

describe('fetchPatchCounts', () => {
  it('asks for each champion\'s "Patch history" page and counts its entries', async () => {
    const urls: string[] = [];
    const counts = await fetchPatchCounts(['Ahri', 'Zed'], (url) => {
      urls.push(url);
      return Promise.resolve(
        apiResponse([
          { title: 'Ahri/Patch history', content: history(5) },
          { title: 'Zed/Patch history', content: history(2) },
        ]),
      );
    });
    expect(counts.get('Ahri')).toBe(5);
    expect(counts.get('Zed')).toBe(2);
    const url = new URL(urls[0] ?? '');
    expect(url.searchParams.get('titles')).toBe('Ahri/Patch history|Zed/Patch history');
    expect(url.searchParams.get('redirects')).toBe('1');
  });

  it('follows redirects such as "Nunu & Willump" to "Nunu"', async () => {
    const counts = await fetchPatchCounts(['Nunu & Willump'], () =>
      Promise.resolve(
        apiResponse([{ title: 'Nunu/Patch history', content: history(7) }], {
          redirects: [['Nunu & Willump/Patch history', 'Nunu/Patch history']],
        }),
      ),
    );
    expect(counts.get('Nunu & Willump')).toBe(7);
  });

  it('follows title normalisation, then the redirect', async () => {
    const counts = await fetchPatchCounts(["kai'sa"], () =>
      Promise.resolve(
        apiResponse([{ title: "Kai'Sa/Patch history", content: history(4) }], {
          normalized: [["kai'sa/Patch history", "Kai'sa/Patch history"]],
          redirects: [["Kai'sa/Patch history", "Kai'Sa/Patch history"]],
        }),
      ),
    );
    expect(counts.get("kai'sa")).toBe(4);
  });

  it('leaves out champions without a patch history page', async () => {
    const counts = await fetchPatchCounts(['Ahri', 'Brandnew'], () =>
      Promise.resolve(
        apiResponse([
          { title: 'Ahri/Patch history', content: history(1) },
          { title: 'Brandnew/Patch history' },
        ]),
      ),
    );
    expect([...counts.keys()]).toEqual(['Ahri']);
  });

  it('splits a long list into several requests', async () => {
    const names = Array.from({ length: 60 }, (_, i) => `Champ${String(i)}`);
    let calls = 0;
    const counts = await fetchPatchCounts(names, (url) => {
      calls++;
      const titles = (new URL(url).searchParams.get('titles') ?? '').split('|');
      return Promise.resolve(apiResponse(titles.map((title) => ({ title, content: history(1) }))));
    });
    expect(calls).toBe(3);
    expect(counts.size).toBe(60);
  });

  it('fails when the response does not have the expected shape', async () => {
    await expect(
      fetchPatchCounts(['Ahri'], () => Promise.resolve('{"error":"x"}')),
    ).rejects.toThrow();
  });
});
