import { cleanup, render, screen, waitFor, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanSeed } from '../../src/ui/randomSeed';
import { EndlessScreen } from '../../src/ui/EndlessScreen';
import { realGameData } from '../support/realGameData';

afterEach(cleanup);

const renderEndless = (seed = 'test', onSeedChange = vi.fn()) =>
  render(<EndlessScreen data={realGameData} initialSeed={seed} onSeedChange={onSeedChange} />);

const questionText = () => screen.getByRole('heading', { level: 2, name: /^Which / }).textContent;
const coverageSummary = () => screen.getByText(/questions seen/).textContent;
/** Counting happens after rendering, so wait for it instead of reading it right away. */
const expectCoverage = (pattern: RegExp) =>
  waitFor(() => {
    expect(coverageSummary()).toMatch(pattern);
  });
const askedTotal = () =>
  [...document.querySelectorAll('.coverage tbody tr')]
    .map((row) => Number(row.querySelectorAll('td')[0]?.textContent))
    .reduce((sum, n) => sum + n, 0);

describe('EndlessScreen', () => {
  it('shows a question with four options, and says it is for testing', () => {
    renderEndless();
    expect(screen.getByText(/Nothing is saved/)).toBeTruthy();
    expect(screen.getByText('Question 1')).toBeTruthy();
    expect(questionText()).toMatch(/^Which .*\?$/);
    // Four option buttons plus the controls: count the cards.
    expect(document.querySelectorAll('.card')).toHaveLength(4);
  });

  it('shows the same questions for the same seed, and different ones for another', () => {
    renderEndless('same');
    const first = questionText();
    cleanup();
    renderEndless('same');
    expect(questionText()).toBe(first);
    cleanup();

    const others = new Set<string | null>();
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      renderEndless(seed);
      others.add(questionText());
      cleanup();
    }
    expect(others.size).toBeGreaterThan(1);
  });

  it('reveals the values after an answer and moves on with Next', async () => {
    const user = userEvent.setup();
    renderEndless();
    // A stat question, the only kind with values to reveal.
    await user.selectOptions(screen.getByLabelText(/Question/), 'itemCost');
    await user.click(document.querySelectorAll<HTMLButtonElement>('.card')[0] as HTMLButtonElement);
    expect(document.querySelectorAll('.card__value')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Next round' }));
    expect(screen.getByText('Question 2')).toBeTruthy();
  });

  it('keeps going past five questions, with no end', async () => {
    const user = userEvent.setup();
    renderEndless();
    for (let i = 0; i < 8; i++) {
      await user.click(screen.getByRole('button', { name: 'Skip question' }));
    }
    expect(screen.getByText('Question 9')).toBeTruthy();
  });

  it('counts each question once when it appears, and counts correct answers', async () => {
    const user = userEvent.setup();
    renderEndless();
    await expectCoverage(/^1 of \d+ questions seen/);

    await user.click(screen.getByRole('button', { name: 'Skip question' }));
    await user.click(screen.getByRole('button', { name: 'Skip question' }));
    await waitFor(() => {
      expect(askedTotal()).toBe(3);
    });

    // A right answer is counted as correct, a wrong one is not: never more than one correct.
    await user.click(document.querySelectorAll<HTMLButtonElement>('.card')[0] as HTMLButtonElement);
    const correct = [...document.querySelectorAll('.coverage tbody tr')]
      .map((row) => Number(row.querySelectorAll('td')[1]?.textContent))
      .reduce((sum, n) => sum + n, 0);
    expect(correct).toBeLessThanOrEqual(1);
  });

  it('flags the questions that have not been seen yet', () => {
    renderEndless();
    expect(document.querySelectorAll('.coverage__missing').length).toBe(
      realGameData.questions.length - 1,
    );
    expect(screen.getAllByText('not seen yet').length).toBe(realGameData.questions.length - 1);
  });

  it('can be restricted to one question', async () => {
    const user = userEvent.setup();
    renderEndless();
    await user.selectOptions(screen.getByLabelText(/Question/), 'itemCost');
    expect(questionText()).toBe('Which item costs the most gold?');
    await user.click(screen.getByRole('button', { name: 'Skip question' }));
    expect(questionText()).toBe('Which item costs the most gold?');
  });

  it('lists the questions of the chosen category only, and asks only those', async () => {
    const user = userEvent.setup();
    renderEndless();
    const select = screen.getByLabelText<HTMLSelectElement>(/Question/);
    const optionIds = () =>
      [...select.options].map((option) => option.value).filter((value) => value !== 'any');
    const idsOf = (category: string) =>
      realGameData.questions.filter((q) => q.category === category).map((q) => q.id);

    expect(optionIds()).toHaveLength(realGameData.questions.length);
    await user.selectOptions(screen.getByLabelText(/Category/), 'esports');
    expect(optionIds().sort()).toEqual(idsOf('esports').sort());

    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('button', { name: 'Skip question' }));
      const shown = document.querySelector('.endless__debug code:nth-of-type(2)')?.textContent;
      expect(idsOf('esports')).toContain(shown);
    }
  });

  it('groups the coverage table by category', () => {
    renderEndless();
    const headings = [...document.querySelectorAll('.coverage h3')].map((h) => h.textContent);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toMatch(/^Stats/);
    expect(document.querySelectorAll('.coverage table')).toHaveLength(3);
  });

  it('can be restricted to one difficulty and shows it', async () => {
    const user = userEvent.setup();
    renderEndless();
    await user.selectOptions(screen.getByLabelText(/Difficulty/), '4');
    expect(screen.getByText(/difficulty 5 \(gap 2-5%\)/)).toBeTruthy();
  });

  it('says so when a question cannot be built at a difficulty', async () => {
    const user = userEvent.setup();
    renderEndless();
    await user.selectOptions(screen.getByLabelText(/Question/), 'moveSpeed');
    await user.selectOptions(screen.getByLabelText(/Difficulty/), '0');
    expect(screen.getByText(/cannot be built at this difficulty/)).toBeTruthy();
    expect(document.querySelectorAll('.card')).toHaveLength(0);
  });

  it('starts over with a new seed and tells the page about it', async () => {
    const user = userEvent.setup();
    const onSeedChange = vi.fn();
    renderEndless('first', onSeedChange);
    await user.click(screen.getByRole('button', { name: 'Skip question' }));
    // Counting happens after rendering; let it finish so it cannot land after the reset below.
    await expectCoverage(/^2 of/);
    await user.click(screen.getByRole('button', { name: 'New seed' }));

    expect(screen.getByText('Question 1')).toBeTruthy();
    await expectCoverage(/^1 of/);
    expect(onSeedChange).toHaveBeenCalledOnce();
    const newSeed = onSeedChange.mock.calls[0]?.[0] as string;
    expect(newSeed).not.toBe('first');
    expect(within(document.body).getByText(newSeed)).toBeTruthy();
  });
});

describe('cleanSeed', () => {
  it('trims, shortens and treats empty as missing', () => {
    expect(cleanSeed('  abc ')).toBe('abc');
    expect(cleanSeed('x'.repeat(100))).toHaveLength(40);
    expect(cleanSeed('')).toBeUndefined();
    expect(cleanSeed('   ')).toBeUndefined();
    expect(cleanSeed(null)).toBeUndefined();
  });
});
