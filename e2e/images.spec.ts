import { addUtcDays, formatUtcDate } from '../src/game/date';
import { GAME_MODES } from '../src/game/gameMode';
import { playFullDay } from './helpers';
import { expect, test } from './test';

/**
 * Tomorrow's puzzle, which the page also carries, is built from the newest data, whose snapshots
 * always point at the downloaded icons. One in effect today may still name Data Dragon (made
 * before the icons were downloaded), and a snapshot in effect is never edited.
 */
const NEWEST_DATA_DAY = addUtcDays(formatUtcDate(new Date()), 1);
const IMAGE_SOURCE = /<img[^>]*\ssrc="([^"]+)"/g;

for (const mode of GAME_MODES) {
  test(`${mode}: every image of the day comes from the site itself`, async ({ page, baseURL }) => {
    const siteOrigin = new URL(baseURL ?? '').origin;
    // The page's built-in round 1 is the build day's (today's), which the browser fetches before
    // the app swaps in tomorrow's; its data is checked by tests/data/publishedIcons.test.ts.
    const builtInMarkup = await (await page.request.get(`/${mode}.html`)).text();
    const builtInImages = new Set(
      [...builtInMarkup.matchAll(IMAGE_SOURCE)].map(([, source = '']) => source),
    );
    const foreign: string[] = [];
    const broken: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (builtInImages.has(url) || request.resourceType() !== 'image') return;
      if (new URL(url).origin !== siteOrigin) {
        foreign.push(url);
      }
    });
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && !response.ok()) {
        broken.push(response.url());
      }
    });

    await page.clock.setFixedTime(new Date(`${NEWEST_DATA_DAY}T12:00:00Z`));
    await page.goto(`/${mode}.html`);
    // The images of every round are fetched ahead, so a whole day covers them all.
    await playFullDay(page);

    expect(foreign).toEqual([]);
    expect(broken).toEqual([]);
  });
}
