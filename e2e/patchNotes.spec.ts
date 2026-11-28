import { readFileSync } from 'node:fs';
import { expect, test } from './test';
import { collectErrors } from './helpers';

const DAYS = (JSON.parse(readFileSync('data/patchNotes.json', 'utf8')) as unknown[]).length;

test('the patch notes button opens a scrollable window of the notes', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/trivia.html');

  await page.getByRole('button', { name: 'Patch notes' }).click();
  const window = page.getByRole('dialog', { name: 'Patch notes' });
  await expect(window).toBeVisible();
  await expect(window.locator('.patch-note')).toHaveCount(DAYS);
  await expect(window.getByRole('heading', { level: 3 }).first()).toBeVisible();

  // Fits the screen, however long the notes get: the window scrolls instead.
  const box = await window.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.y + box.height <= viewport.height).toBe(true);
  expect(
    await window
      .locator('.patch-notes__frame')
      .evaluate((frame) => getComputedStyle(frame).overflowY),
  ).toBe('auto');

  await page.keyboard.press('Escape');
  await expect(window).toBeHidden();

  await page.getByRole('button', { name: 'Patch notes' }).click();
  await window.getByRole('button', { name: 'Close patch notes' }).click();
  await expect(window).toBeHidden();
  expect(errors).toEqual([]);
});
