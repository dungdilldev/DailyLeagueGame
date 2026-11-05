import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { GAME_MODES } from '../src/game/gameMode';
import { playFullDay } from './helpers';
import { expect, test } from './test';

const SnapshotDatesSchema = z.object({
  snapshots: z.array(z.object({ effectiveFrom: z.string() })),
});

/**
 * The day the newest data takes effect. Its snapshots always point at the downloaded icons, while
 * an older one in effect today may still name Data Dragon (made before the icons were downloaded).
 */
function newestDataDate(): string {
  const dates = ['champions', 'items', 'abilities'].flatMap((name) =>
    SnapshotDatesSchema.parse(
      JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8')),
    ).snapshots.map(({ effectiveFrom }) => effectiveFrom),
  );
  return dates.sort().at(-1) ?? '';
}

for (const mode of GAME_MODES) {
  test(`${mode}: every image of the day comes from the site itself`, async ({ page, baseURL }) => {
    const siteOrigin = new URL(baseURL ?? '').origin;
    const foreign: string[] = [];
    const broken: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'image' && new URL(request.url()).origin !== siteOrigin) {
        foreign.push(request.url());
      }
    });
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && !response.ok()) {
        broken.push(response.url());
      }
    });

    await page.clock.setFixedTime(new Date(`${newestDataDate()}T12:00:00Z`));
    await page.goto(`/${mode}.html`);
    // The images of every round are fetched ahead, so a whole day covers them all.
    await playFullDay(page);

    expect(foreign).toEqual([]);
    expect(broken).toEqual([]);
  });
}
