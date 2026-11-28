import { type Page } from '@playwright/test';
import { expect, test } from './test';
import { collectErrors } from './helpers';

/** The colour the page draws right answers in. */
function rightAnswerColour(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ok').trim(),
  );
}

test('the gear in the header switches colorblind mode on every page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/trivia.html');
  const standard = await rightAnswerColour(page);

  await page.getByRole('button', { name: 'Settings' }).click();
  const toggle = page.getByRole('switch', { name: /Colorblind mode/ });
  await expect(toggle).toBeVisible();
  await toggle.check();
  expect(await rightAnswerColour(page)).not.toBe(standard);

  await page.keyboard.press('Escape');
  await expect(toggle).toBeHidden();

  // Remembered on the next page, and its switch shows it.
  await page.goto('/');
  expect(await rightAnswerColour(page)).not.toBe(standard);
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('switch', { name: /Colorblind mode/ })).toBeChecked();
  expect(errors).toEqual([]);
});
