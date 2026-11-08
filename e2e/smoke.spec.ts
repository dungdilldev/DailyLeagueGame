import { type Locator, type Page } from '@playwright/test';
import { expect, test } from './test';
import { collectErrors, playFullDay, ROUNDS_PER_DAY } from './helpers';

const START_HEADING = 'How well do you know League of Legends?';

/** Waits until every champion icon has actually loaded, not just been added to the page. */
async function expectIconsLoaded(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page
        .locator('.card__icon')
        .evaluateAll((icons) =>
          icons.every((icon) => icon instanceof HTMLImageElement && icon.naturalWidth > 0),
        ),
    )
    .toBe(true);
}

test('a full day can be played and the result survives a reload', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.goto('/stats.html');

  await expect(page.getByRole('link', { name: "Summoner's Quiz" })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByText('CC BY-SA 3.0')).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(4);
  await expectIconsLoaded(page);
  await page.screenshot({ path: testInfo.outputPath('round.png'), fullPage: true });

  await page.locator('.card').first().click();
  // Every kind of question marks the right option once answered; only stat questions show values.
  await expect(page.locator('.card--correct')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('reveal.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next round' }).click();

  for (let round = 2; round <= ROUNDS_PER_DAY; round++) {
    await page.locator('.card').first().click();
    await page
      .getByRole('button', { name: round === ROUNDS_PER_DAY ? 'See results' : 'Next round' })
      .click();
  }
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();
  await expect(page.getByText(/Next puzzle in/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('results.png'), fullPage: true });

  await page.reload();
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();

  expect(errors).toEqual([]);
});

test('progress resumes mid-day after a reload', async ({ page }) => {
  await page.goto('/stats.html');
  await page.locator('.card').first().click();
  await page.getByRole('button', { name: 'Next round' }).click();
  await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();

  await page.reload();
  await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
});

test('layout fits the viewport without horizontal scrolling', async ({ page }) => {
  await page.goto('/stats.html');
  await playFullDay(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('shows a friendly message when the page has no puzzles built in', async ({ page }) => {
  await page.route('**/stats.html', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /<script type="application\/json"[^]*?<\/script>/,
      '',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/stats.html');
  await expect(page.getByRole('alert')).toContainText('Something went wrong');
});

test('an old link to an earlier day opens today and drops the date', async ({ page }) => {
  await page.goto('/stats.html?date=2000-01-01');
  await expect(page.getByText(`Round 1 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
  await expect(page).toHaveURL(/\/stats\.html$/);
  await expect(page.getByRole('navigation', { name: 'Choose puzzle day' })).toHaveCount(0);
});

/** The mode links at the top of the game. */
function modeNav(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Choose game mode' });
}

test.describe('game modes', () => {
  test('the stats page offers one link per mode page', async ({ page }) => {
    await page.goto('/stats.html');
    await expect(modeNav(page).getByRole('link')).toHaveText([
      'Trivia',
      'Lore',
      'Stats',
      'Esports',
      'Mixed',
    ]);
    await expect(modeNav(page).getByRole('link', { name: 'Stats' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('each mode is its own page, with its own heading and saved progress', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/stats.html');
    await page.locator('.card').first().click();
    await page.getByRole('button', { name: 'Next round' }).click();
    await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();

    await modeNav(page).getByRole('link', { name: 'Lore' }).click();
    await expect(page).toHaveURL(/\/lore\.html$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'League of Legends lore quiz' }),
    ).toBeVisible();
    // The lore day has its own progress: it starts at round 1.
    await expect(page.getByText(/^Round 1 of \d/)).toBeVisible();
    await expectIconsLoaded(page);
    await expect(modeNav(page).getByRole('link', { name: 'Lore' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await modeNav(page).getByRole('link', { name: 'Mixed' }).click();
    await expect(page).toHaveURL(/\/mixed\.html$/);
    await expect(page.getByText(/^Round 1 of \d/)).toBeVisible();

    await modeNav(page).getByRole('link', { name: 'Stats' }).click();
    await expect(page).toHaveURL(/\/stats\.html$/);
    await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('old game links open the mode page and keep the rest of the address', async ({ page }) => {
    await page.goto('/play.html?category=lore&seed=abc');
    await expect(page).toHaveURL(/\/lore\.html\?seed=abc$/);
    await expect(page.getByText(/^Round 1 of \d/)).toBeVisible();

    await page.goto('/play.html');
    await expect(page).toHaveURL(/\/trivia\.html$/);
  });

  test('the esports mode plays a full day, with text options and champion options', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/esports.html');
    await expect(page.getByText(`Round 1 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
    await expect(page.locator('.card')).toHaveCount(4);
    await playFullDay(page);
    await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test('the endless testing mode does not exist in the production build', async ({ page }) => {
  await page.goto('/stats.html?mode=endless');
  await expect(page.getByText(/Round 1 of \d/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Endless mode' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Choose game mode' })).toBeVisible();
});

test.describe('information pages', () => {
  const pages = [
    { link: 'How to play', heading: 'How to play' },
    { link: 'About', heading: "About Summoner's Quiz" },
    { link: 'Privacy', heading: 'Privacy policy' },
  ];

  for (const { link, heading } of pages) {
    test(`${link} opens from the footer and links back to the game`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('/stats.html');
      await page.getByRole('navigation', { name: 'Information' }).getByText(link).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      // The shared header and footer were included.
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
      await expect(
        page.getByRole('contentinfo').getByText("isn't endorsed by Riot Games"),
      ).toBeVisible();

      await page.getByRole('link', { name: "Summoner's Quiz" }).click();
      await expect(page.getByRole('heading', { level: 1, name: START_HEADING })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe('start page', () => {
  const modes = [
    { name: 'Trivia', url: /\/trivia\.html$/ },
    { name: 'Lore', url: /\/lore\.html$/ },
    { name: 'Stats', url: /\/stats\.html$/ },
    { name: 'Esports', url: /\/esports\.html$/ },
    { name: 'Mixed', url: /\/mixed\.html$/ },
  ];

  for (const { name, url } of modes) {
    test(`the ${name} card opens the game in that mode`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('/');
      await page
        .getByRole('navigation', { name: 'Game modes' })
        .getByText(name, { exact: true })
        .click();
      await expect(page).toHaveURL(url);
      await expect(page.locator('.card')).toHaveCount(4);
      await expect(modeNav(page).getByRole('link', { name })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(errors).toEqual([]);
    });
  }

  test('shows the countdown and marks a mode once it is played today', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Next puzzle in/)).toBeVisible();
    await expect(page.locator('.mode-card__status:visible')).toHaveCount(0);

    await page.goto('/lore.html');
    await playFullDay(page);
    await page.goto('/');
    await expect(page.locator('.mode-card[data-mode="lore"] .mode-card__status')).toBeVisible();
    await expect(page.locator('.mode-card__status:visible')).toHaveCount(1);
  });

  test('the hero button opens the first mode, trivia', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Play today.s puzzle/ }).click();
    await expect(page).toHaveURL(/\/trivia\.html$/);
    await expect(modeNav(page).getByRole('link', { name: 'Trivia' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('the sample round can be answered', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Jinx' }).click();
    await expect(page.getByText('Not quite: Ezreal has the most skins.')).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('Pick the one with the highest value.')).toBeVisible();
  });

  test('old game links on the start page open the game', async ({ page }) => {
    await page.goto('/?category=esports');
    await expect(page).toHaveURL(/\/esports\.html$/);
    await expect(page.getByText(/^Round 1 of \d/)).toBeVisible();
  });

  test('fits the viewport without horizontal scrolling', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('start page without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('its heading and mode links are in the HTML itself, for crawlers', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: START_HEADING })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Game modes' }).getByRole('link'),
    ).toHaveCount(5);
  });
});
