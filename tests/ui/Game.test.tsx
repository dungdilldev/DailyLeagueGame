import { cleanup, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Puzzle, Round } from '../../src/game/puzzle';
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

const makeRound = (statLabel: string, answerId: string): Round => ({
  statId: statLabel,
  statLabel,
  question: `Which champion has the highest ${statLabel.toLowerCase()}?`,
  format: { kind: 'number' },
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
      // Days since the epoch: Ahri 12 days after 2013-06-01 is Jun 13, 2013.
      format: { kind: 'date', epoch: '2013-06-01' },
      values: { Ahri: 12, Brand: 3, Ciri: 2, Dave: 1 },
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
      date={TODAY}
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
        date={TODAY}
        today={TODAY}
        storage={undefined}
        shareUrl="https://example.com/"
      />,
    );
    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    expect(screen.getByText('Correct!')).toBeTruthy();
  });

  it('an earlier day can be played but does not count towards the streak', async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    render(
      <Game
        puzzle={{ ...puzzle, date: '2026-03-04' }}
        champions={champions}
        date="2026-03-04"
        today={TODAY}
        storage={storage}
        shareUrl="https://example.com/"
      />,
    );

    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    await user.click(screen.getByRole('button', { name: 'Next round' }));
    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    await user.click(screen.getByRole('button', { name: 'See results' }));

    expect(screen.getByText('2/2')).toBeTruthy();
    expect(screen.getByText('No streak yet')).toBeTruthy();
    expect(screen.queryByText(/Next puzzle in/)).toBeNull();
    expect(screen.getByText(/earlier puzzle/)).toBeTruthy();
    expect(loadSavedDays(storage)['2026-03-04']?.late).toBe(true);
  });

  it('keeps progress for different days separate', async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    const today = (
      <Game
        puzzle={puzzle}
        champions={champions}
        date={TODAY}
        today={TODAY}
        storage={storage}
        shareUrl="https://example.com/"
      />
    );
    render(today);
    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    cleanup();

    render(
      <Game
        puzzle={{ ...puzzle, date: '2026-03-04' }}
        champions={champions}
        date="2026-03-04"
        today={TODAY}
        storage={storage}
        shareUrl="https://example.com/"
      />,
    );
    expect(screen.getByText(/Round 1 of 2/)).toBeTruthy();
  });
});
