import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { realGameData } from '../support/realGameData';

const PNG_SIGNATURE = '\x89PNG';
/** Snapshots made before the icons were downloaded still point at Data Dragon. */
const isLocal = (iconUrl: string) => !/^https?:/.test(iconUrl);

const localIcons = [
  ...new Set(
    [realGameData.champions, realGameData.items, realGameData.abilities].flatMap((file) =>
      file.snapshots.flatMap((snapshot) => snapshot.entities.map(({ iconUrl }) => iconUrl)),
    ),
  ),
].filter(isLocal);

describe('icons of the published data', () => {
  it('has a downloaded PNG for every icon a snapshot points at (run `npm run data:refresh`)', () => {
    const missing = localIcons.filter((iconUrl) => {
      const file = path.join('public', iconUrl);
      return (
        !existsSync(file) || readFileSync(file).subarray(0, 4).toString('latin1') !== PNG_SIGNATURE
      );
    });
    expect(localIcons.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
