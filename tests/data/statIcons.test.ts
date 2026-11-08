import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STAT_ICON_FILES, statIconUrl, type StatIcon } from '../../src/data/statIcons';

const PNG_SIGNATURE = '\x89PNG';
const DATA_FILES = ['champions', 'items', 'abilities'];

const savedFiles = (Object.keys(STAT_ICON_FILES) as StatIcon[]).map((icon) =>
  path.join('public', statIconUrl(icon)),
);

/** Every symbol path the published stat definitions point at. */
function publishedSymbols(): string[] {
  return DATA_FILES.flatMap((name) => {
    const file = JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8')) as {
      stats: { unitIconUrl?: string }[];
    };
    return file.stats.flatMap(({ unitIconUrl }) => (unitIconUrl ? [unitIconUrl] : []));
  });
}

describe('statIconUrl', () => {
  it('serves each symbol from our own images folder', () => {
    expect(statIconUrl('armor')).toBe('images/stats/armor.png');
  });
});

describe('downloaded stat symbols', () => {
  it('has a file for every symbol (run `npm run images:download` if not)', () => {
    expect(savedFiles.filter((file) => !existsSync(file))).toEqual([]);
  });

  it('holds real images, not an error page saved by mistake', () => {
    const notImages = savedFiles.filter(
      (file) => readFileSync(file).subarray(0, 4).toString('latin1') !== PNG_SIGNATURE,
    );
    expect(notImages).toEqual([]);
  });

  it('covers every symbol the data files name', () => {
    const missing = publishedSymbols().filter((url) => !existsSync(path.join('public', url)));
    expect(missing).toEqual([]);
    expect(publishedSymbols().length).toBeGreaterThan(0);
  });
});
