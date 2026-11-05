import { addUtcDays, formatUtcDate } from '../src/game/date';
import { playFullDay, ROUNDS_PER_DAY } from './helpers';
import { expect, test } from './test';

/**
 * The day the build under test was made for: by default a build is for today (UTC). Each game
 * page carries this day's puzzle and the next one.
 */
const BUILD_DAY = formatUtcDate(new Date());
const FIRST_ROUND = `Round 1 of ${String(ROUNDS_PER_DAY)}`;

test('after midnight UTC the page plays the next puzzle it carries', async ({ page }) => {
  await page.clock.install({ time: new Date(`${BUILD_DAY}T23:58:00Z`) });
  await page.goto('/stats.html');
  await playFullDay(page);
  await expect(page.getByText(/Next puzzle in/)).toBeVisible();

  await page.clock.fastForward('05:00');
  await page.getByRole('button', { name: 'Play it' }).click();
  await expect(page.getByText(FIRST_ROUND)).toBeVisible();
  await expect(page.getByText(/not out yet/)).toHaveCount(0);
});

test('when a build was missed, the page plays its newest puzzle and says so', async ({ page }) => {
  await page.clock.install({ time: new Date(`${addUtcDays(BUILD_DAY, 2)}T12:00:00Z`) });
  await page.goto('/lore.html');
  await expect(page.getByText(/Today's puzzle is not out yet/)).toBeVisible();
  await expect(page.getByText(FIRST_ROUND)).toBeVisible();
});

test('a returning player never sees the built-in round 1 flash up', async ({ page }) => {
  await page.goto('/stats.html');
  await page.locator('.card').first().click();
  await page.getByRole('button', { name: 'Next round' }).click();

  // Hold the app's script back, to look at the page as it is before the app runs.
  let releaseScript: () => void = () => undefined;
  const scriptHeld = new Promise<void>((resolve) => {
    releaseScript = resolve;
  });
  await page.route('**/assets/main-*.js', async (route) => {
    await scriptHeld;
    await route.continue();
  });
  await page.reload({ waitUntil: 'commit' });
  await expect(page.locator('#app')).toHaveClass(/game__app--pending/);
  await expect(page.locator('#app .round')).toBeHidden();

  releaseScript();
  await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
  await expect(page.locator('#app')).not.toHaveClass(/game__app--pending/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a game page already holds the first question and its options', async ({ page }) => {
    await page.goto('/trivia.html');
    await expect(page.locator('#app h2')).toHaveText(/\?$/);
    await expect(page.locator('#app .card')).toHaveCount(4);
    await expect(page.getByText(FIRST_ROUND)).toBeVisible();
  });
});
