import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChampionDataFileSchema } from '../../src/data/schema';
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
    expect(visibleText(FEEDBACK)).toEqual(['Pick the one with the highest value.']);
    expect(sampleRound().querySelectorAll('button[data-option]:disabled')).toHaveLength(0);
  });

  it('marks a right pick as correct and dims the others', () => {
    option('Ezreal').click();

    expect(option('Ezreal').classList).toContain('sample-option--correct');
    expect(option('Ezreal').getAttribute('aria-pressed')).toBe('true');
    expect(option('Jinx').classList).toContain('sample-option--other');
    expect(visibleText(FEEDBACK)).toEqual([
      'Correct! Ezreal has the most skins of these four.',
      'Try again',
    ]);
  });

  it('marks a wrong pick and still shows the right answer', () => {
    option('Ornn').click();

    expect(option('Ornn').classList).toContain('sample-option--wrong');
    expect(option('Ezreal').classList).toContain('sample-option--correct');
    expect(option('Yuumi').disabled).toBe(true);
    expect(visibleText(FEEDBACK)).toEqual(['Not quite: Ezreal has the most skins.', 'Try again']);
    expect(document.activeElement?.textContent.trim()).toBe('Try again');
  });

  it('can be played again after "Try again"', () => {
    option('Ornn').click();
    const reset = sampleRound().querySelector<HTMLButtonElement>('[data-sample-reset]');
    reset?.click();

    expect(visibleText(FEEDBACK)).toEqual(['Pick the one with the highest value.']);
    expect(option('Ornn').className).toBe('sample-option');
    expect(option('Ornn').disabled).toBe(false);
  });
});

// The sample is hand-written HTML; this keeps it true to the data the real question uses.
describe('the sample round', () => {
  const SAMPLE_STAT = 'skinCount';
  const champions = ChampionDataFileSchema.parse(
    JSON.parse(readFileSync('public/data/champions.json', 'utf8')),
  ).snapshots.at(-1)?.entities;
  const page = new DOMParser().parseFromString(START_PAGE, 'text/html');
  const optionButtons = [...page.querySelectorAll<HTMLButtonElement>('[data-option]')];

  function championOf(button: HTMLButtonElement) {
    const name = button.textContent.trim();
    const champion = champions?.find((candidate) => candidate.name === name);
    if (!champion) throw new Error(`${name} is not in champions.json`);
    return champion;
  }

  it('shows each champion with its own downloaded icon', () => {
    for (const button of optionButtons) {
      const src = button.querySelector('img')?.getAttribute('src');
      expect(src).toBe(`/${championOf(button).iconUrl}`);
      expect(existsSync(`public${String(src)}`)).toBe(true);
    }
  });

  it('has as its answer the champion with the most skins in the newest data', () => {
    const counts = optionButtons.map((button) => championOf(button).stats[SAMPLE_STAT] ?? 0);
    const answerIndex = optionButtons.findIndex((button) => button.hasAttribute('data-answer'));
    const highest = Math.max(...counts);

    expect(counts[answerIndex]).toBe(highest);
    expect(counts.filter((count) => count === highest)).toHaveLength(1);
  });
});
