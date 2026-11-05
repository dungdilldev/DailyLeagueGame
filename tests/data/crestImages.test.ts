import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CREST_FILES, CREST_IMAGE_DIRECTORY, crestImagePath } from '../../src/data/crestImages';

const PNG_SIGNATURE = '\x89PNG';
const SVG_START = /^(<\?xml[^>]*>\s*)?<svg/;

const savedFiles = [...new Set(Object.values(CREST_FILES))].map((fileName) =>
  path.join('public', CREST_IMAGE_DIRECTORY, crestImagePath(fileName)),
);

describe('crestImagePath', () => {
  it("names the file after the wiki file and keeps the wiki's format", () => {
    expect(crestImagePath('Shadow Isles Crest icon.png')).toBe('shadow-isles-crest-icon.png');
    expect(crestImagePath('Sentinels of Light Crest icon.svg')).toBe(
      'sentinels-of-light-crest-icon.svg',
    );
  });
});

describe('downloaded crests', () => {
  it('has a file for every crest (run `npm run images:download` if not)', () => {
    expect(savedFiles.filter((file) => !existsSync(file))).toEqual([]);
  });

  it('holds real images, not an error page saved by mistake', () => {
    const notImages = savedFiles.filter((file) => {
      const content = readFileSync(file);
      return file.endsWith('.svg')
        ? !SVG_START.test(content.toString('utf8').trimStart())
        : content.subarray(0, 4).toString('latin1') !== PNG_SIGNATURE;
    });
    expect(notImages).toEqual([]);
  });
});
