import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { iconPath } from '../../pipeline/icons/iconPaths';
import { iconSources } from '../../pipeline/icons/iconSources';
import { planIconSync, syncIcons, type IconSource } from '../../pipeline/icons/syncIcons';
import { makeInput, makeItemInput } from './fixtures';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const AHRI = iconPath('champions', 'Ahri');
const LUX = iconPath('champions', 'Lux');
const source = (iconFile: string): IconSource => ({
  path: iconFile,
  url: `https://ddragon.example/${iconFile}`,
});

describe('iconPath', () => {
  it('names the file after our id, by kind', () => {
    expect(iconPath('abilities', 'MissFortuneR')).toBe('images/icons/abilities/MissFortuneR.png');
  });
});

describe('iconSources', () => {
  it("pairs each entity's Data Dragon icon with its local path", () => {
    const sources = iconSources('16.21.1', {
      champions: [makeInput('Ahri')],
      items: [makeItemInput('3031')],
      abilities: [],
    });
    expect(sources).toEqual([
      {
        path: 'images/icons/champions/Ahri.png',
        url: 'https://ddragon.leagueoflegends.com/cdn/16.21.1/img/champion/Ahri.png',
      },
      {
        path: 'images/icons/items/3031.png',
        url: 'https://ddragon.leagueoflegends.com/cdn/16.21.1/img/item/3031.png',
      },
    ]);
  });
});

describe('planIconSync', () => {
  it('fetches only missing icons while the version stays the same', () => {
    const plan = planIconSync({
      sources: [source(AHRI), source(LUX)],
      inUse: new Set(),
      existing: new Set([AHRI]),
      isNewVersion: false,
    });
    expect(plan.download.map(({ path: iconFile }) => iconFile)).toEqual([LUX]);
  });

  it('fetches every icon again for a new version, whose art may have changed', () => {
    const plan = planIconSync({
      sources: [source(AHRI), source(LUX)],
      inUse: new Set(),
      existing: new Set([AHRI, LUX]),
      isNewVersion: true,
    });
    expect(plan.download).toHaveLength(2);
  });

  it('deletes icons nothing uses, but keeps one an older snapshot still needs', () => {
    const removedItem = iconPath('items', '1001');
    const gone = iconPath('items', '9999');
    const plan = planIconSync({
      sources: [source(AHRI)],
      inUse: new Set([AHRI, removedItem]),
      existing: new Set([AHRI, removedItem, gone]),
      isNewVersion: false,
    });
    expect(plan.remove).toEqual([gone]);
  });
});

describe('syncIcons', () => {
  let siteRoot: string;
  beforeEach(async () => {
    siteRoot = await mkdtemp(path.join(os.tmpdir(), 'icons-'));
  });
  afterEach(async () => {
    await rm(siteRoot, { recursive: true, force: true });
  });

  const fetched: string[] = [];
  const fetchPng = (url: string) => {
    fetched.push(url);
    return Promise.resolve(PNG);
  };

  it('saves the icons and the version, then fetches nothing on a second run', async () => {
    fetched.length = 0;
    const input = {
      siteRoot,
      sources: [source(AHRI)],
      inUse: new Set<string>(),
      fetcher: fetchPng,
    };
    expect(await syncIcons({ ...input, version: '1.0' })).toEqual({ downloaded: 1, removed: 0 });
    expect(await readFile(path.join(siteRoot, AHRI))).toEqual(Buffer.from(PNG));

    expect(await syncIcons({ ...input, version: '1.0' })).toEqual({ downloaded: 0, removed: 0 });
    expect(fetched).toHaveLength(1);
  });

  it('deletes an icon no data uses any more', async () => {
    const stale = path.join(siteRoot, LUX);
    await mkdir(path.dirname(stale), { recursive: true });
    await writeFile(stale, PNG);
    await syncIcons({
      siteRoot,
      sources: [source(AHRI)],
      inUse: new Set(),
      version: '1.0',
      fetcher: fetchPng,
    });
    expect(existsSync(stale)).toBe(false);
  });

  it('fails on a download that is not a PNG, and records no version', async () => {
    const run = syncIcons({
      siteRoot,
      sources: [source(AHRI)],
      inUse: new Set(),
      version: '1.0',
      fetcher: () => Promise.resolve(new TextEncoder().encode('<html>error</html>')),
    });
    await expect(run).rejects.toThrow('is not a PNG image');
    expect(existsSync(path.join(siteRoot, 'images/icons/version.txt'))).toBe(false);
  });
});
