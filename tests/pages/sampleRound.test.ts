import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { enableSampleRound } from '../../src/pages/sampleRound';

// The real start page, so the test fails if its markup and the script stop matching.
const START_PAGE = readFileSync('index.html', 'utf8');

function sampleRound(): HTMLElement {
  const root = document.querySelector('[data-sample-round]');
  if (!(root instanceof HTMLElement)) throw new Error('index.html has no sample round');
  return root;
}

function option(name: string): HTMLButtonElement {
  const button = [...sampleRound().querySelectorAll('button')].find((candidate) =>
    candidate.textContent.includes(name),
  );
  if (!button) throw new Error(`No option named ${name}`);
  return button;
}

function visibleText(selector: string): string[] {
  return [...sampleRound().querySelectorAll<HTMLElement>(selector)]
    .filter((element) => !element.hidden)
    .map((element) => element.textContent.trim());
}

const FEEDBACK = '[data-sample-prompt], [data-sample-result], [data-sample-reset]';

describe('enableSampleRound', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = new DOMParser().parseFromString(
      START_PAGE,
      'text/html',
    ).documentElement.innerHTML;
    enableSampleRound(sampleRound());
  });

  it('starts unanswered, with only the prompt shown', () => {
    expect(visibleText(FEEDBACK)).toEqual(['Pick one of the four answers.']);
    expect(sampleRound().querySelectorAll('button[data-option]:disabled')).toHaveLength(0);
  });

  it('marks a right pick as correct and dims the others', () => {
    option('Teemo').click();

    expect(option('Teemo').classList).toContain('sample-option--correct');
    expect(option('Teemo').getAttribute('aria-pressed')).toBe('true');
    expect(option('Garen').classList).toContain('sample-option--other');
    expect(visibleText(FEEDBACK)).toEqual(['Correct! Teemo is a yordle.', 'Try again']);
  });

  it('marks a wrong pick and still shows the right answer', () => {
    option('Darius').click();

    expect(option('Darius').classList).toContain('sample-option--wrong');
    expect(option('Teemo').classList).toContain('sample-option--correct');
    expect(option('Ahri').disabled).toBe(true);
    expect(visibleText(FEEDBACK)).toEqual(['Not quite: Teemo is the yordle.', 'Try again']);
    expect(document.activeElement?.textContent.trim()).toBe('Try again');
  });

  it('can be played again after "Try again"', () => {
    option('Darius').click();
    const reset = sampleRound().querySelector<HTMLButtonElement>('[data-sample-reset]');
    reset?.click();

    expect(visibleText(FEEDBACK)).toEqual(['Pick one of the four answers.']);
    expect(option('Darius').className).toBe('sample-option');
    expect(option('Darius').disabled).toBe(false);
  });
});
