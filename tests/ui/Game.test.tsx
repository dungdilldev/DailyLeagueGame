import { cleanup, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Puzzle } from '../../src/data/puzzleSchema';
import type { Champion } from '../../src/data/schema';
import { Game } from '../../src/ui/Game';
import { loadSavedDays, type StorageLike } from '../../src/storage/progressStore';

afterEach(cleanup);

const TODAY = '2026-03-05';
const IDS = ['Ahri', 'Brand', 'Ciri', 'Dave'];

const champions = new Map<string, Champion>(
  IDS.map((id) => [
    id,
    { id, name: id, title: '', classes: [], iconUrl: `https://example.com/${id}.png`, stats: {} },
  ]),
);

const makeRound = (statLabel: string, answerId: string) => ({
  statId: statLabel,
  statLabel,
  championIds: IDS,
  answerId,
  values: { Ahri: 400, Brand: 300, Ciri: 200, Dave: 100 },
});

const puzzle: Puzzle = {
  date: TODAY,
  patch: '1.0',
  rounds: [
    makeRound('Base health', 'Ahri'),
    {
      ...makeRound('Release date', 'Ahri'),
      question: 'Which champion was released most recently?',
      displayValues: {
        Ahri: 'Jun 13, 2013',
        Brand: 'Jan 1, 2010',
        Ciri: 'Feb 2, 2010',
        Dave: 'Mar 3, 2010',
      },
    },
  ],
};

function memoryStorage(): StorageLike & { value: string | null } {
  return {
    value: null,
    getItem() {
      return this.value;
    },
    setItem(_key, value) {
      this.value = value;
    },
  };
}

const renderGame = (storage: StorageLike) =>
  render(
    <Game
      puzzle={puzzle}
      champions={champions}
      today={TODAY}
      storage={storage}
      shareUrl="https://example.com/"
    />,
  );

describe('Game', () => {
  it('plays a full day: answer, reveal, next, results', async () => {
    const user = userEvent.setup();
    renderGame(memoryStorage());

    expect(screen.getByText(/Round 1 of 2/)).toBeTruthy();
    expect(screen.getByText('Which champion has the highest base health?')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Ahri/ }));

    // Reveal: values are shown, feedback is announced, and the cards are locked.
    expect(screen.getByText('Correct!')).toBeTruthy();
    expect(screen.getByText('400')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Brand/ }).hasAttribute('disabled')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Next round' }));
    expect(screen.getByText(/Round 2 of 2/)).toBeTruthy();
    // Round 1 has no stored question (older puzzle format): derived from the label. Round 2 has one.
    expect(screen.getByText('Which champion was released most recently?')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Brand/ }));
    expect(screen.getByText('Jun 13, 2013')).toBeTruthy();
    expect(screen.getByText(/Not quite. It was Ahri/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'See results' }));
    expect(screen.getByText('1/2')).toBeTruthy();
    expect(screen.getByText(/Streak: 1 day/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Share result' })).toBeTruthy();
  });

  it('saves progress and resumes mid-day after a reload', async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    renderGame(storage);
    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    cleanup();

    renderGame(storage);
    expect(screen.getByText(/Round 2 of 2/)).toBeTruthy();
    expect(loadSavedDays(storage)[TODAY]?.answers).toEqual(['Ahri']);
  });

  it('shows results straight away for a day that is already complete', () => {
    const storage = memoryStorage();
    storage.setItem(
      'dailyleague:v1',
      JSON.stringify({ [TODAY]: { answers: ['Ahri', 'Ahri'], complete: true } }),
    );
    renderGame(storage);
    expect(screen.getByText('2/2')).toBeTruthy();
  });

  it('still works when storage is unavailable', async () => {
    const user = userEvent.setup();
    render(
      <Game
        puzzle={puzzle}
        champions={champions}
        today={TODAY}
        storage={undefined}
        shareUrl="https://example.com/"
      />,
    );
    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    expect(screen.getByText('Correct!')).toBeTruthy();
  });
});
