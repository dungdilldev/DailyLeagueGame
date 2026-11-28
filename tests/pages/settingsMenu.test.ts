import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { enableSettings } from '../../src/pages/settingsMenu';
import { loadSettings, saveSettings } from '../../src/storage/settings';
import { COLORBLIND_CHANGE_EVENT } from '../../src/ui/colorblindMode';

// The real shared header, so the test fails if its markup and the script stop matching.
const HEADER = readFileSync('src/pages/partials/header.html', 'utf8');

function element<T extends Element>(selector: string, type: new () => T): T {
  const found = document.querySelector(selector);
  if (!(found instanceof type)) throw new Error(`The header has no ${selector}`);
  return found;
}

const gear = () => element('.settings__gear', HTMLButtonElement);
const panel = () => element('.settings__panel', HTMLElement);
const isOpen = () => !panel().hidden;
const toggle = () => element('[data-colorblind-toggle]', HTMLInputElement);
const colorblindOn = () => document.documentElement.hasAttribute('data-colorblind');

function switchColorblind(checked: boolean): void {
  toggle().checked = checked;
  toggle().dispatchEvent(new Event('change'));
}

describe('enableSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-colorblind');
    document.body.innerHTML = `${HEADER}<main><p>Game</p></main>`;
  });

  it('starts with colorblind mode off', () => {
    enableSettings(document);
    expect(colorblindOn()).toBe(false);
    expect(toggle().checked).toBe(false);
  });

  it('switches the page colours, remembers the choice and tells the app', () => {
    enableSettings(document);
    let changes = 0;
    document.addEventListener(COLORBLIND_CHANGE_EVENT, () => {
      changes += 1;
    });

    switchColorblind(true);
    expect(colorblindOn()).toBe(true);
    expect(loadSettings(localStorage).colorblind).toBe(true);

    switchColorblind(false);
    expect(colorblindOn()).toBe(false);
    expect(loadSettings(localStorage).colorblind).toBe(false);
    expect(changes).toBe(2);
  });

  it('applies the saved choice on the next page', () => {
    saveSettings(localStorage, { colorblind: true });
    enableSettings(document);
    expect(colorblindOn()).toBe(true);
    expect(toggle().checked).toBe(true);
  });

  it('opens and closes with the gear, which says whether it is open', () => {
    enableSettings(document);
    expect(isOpen()).toBe(false);

    gear().click();
    expect(isOpen()).toBe(true);
    expect(gear().getAttribute('aria-expanded')).toBe('true');

    gear().click();
    expect(isOpen()).toBe(false);
    expect(gear().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on a click outside the menu but not inside it', () => {
    enableSettings(document);
    gear().click();

    toggle().click();
    expect(isOpen()).toBe(true);

    element('main p', HTMLParagraphElement).click();
    expect(isOpen()).toBe(false);
  });

  it('closes on Escape and gives focus back to the gear', () => {
    enableSettings(document);
    gear().click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(gear());
  });
});
