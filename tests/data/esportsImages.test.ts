import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ESPORTS_IMAGE_DIRECTORY,
  esportsImagePath,
  esportsImages,
  type EsportsImageKind,
} from '../../src/data/esportsImages';

const WEBP_SIGNATURE = 'WEBP';

describe('esportsImagePath', () => {
  it('turns names into plain file names', () => {
    expect(esportsImagePath('teams', 'Gen.G')).toBe('teams/gen-g.webp');
    expect(esportsImagePath('players', 'Hans Sama')).toBe('players/hans-sama.webp');
    expect(esportsImagePath('teams', 'Alovédra Esports')).toBe('teams/alovedra-esports.webp');
  });
});

describe('data/esportsImages.json', () => {
  const entries = (Object.keys(esportsImages) as EsportsImageKind[]).flatMap((kind) =>
    Object.keys(esportsImages[kind]).map((name) => ({ kind, name })),
  );

  it('has a downloaded image for every entry (run `npm run images:download` if not)', () => {
    const missing = entries.filter(
      ({ kind, name }) =>
        !existsSync(path.join('public', ESPORTS_IMAGE_DIRECTORY, esportsImagePath(kind, name))),
    );
    expect(missing).toEqual([]);
  });

  it('holds real images, not an error page saved by mistake', () => {
    const notImages = entries.filter(({ kind, name }) => {
      const file = path.join('public', ESPORTS_IMAGE_DIRECTORY, esportsImagePath(kind, name));
      return readFileSync(file).subarray(8, 12).toString('ascii') !== WEBP_SIGNATURE;
    });
    expect(notImages).toEqual([]);
  });
});
