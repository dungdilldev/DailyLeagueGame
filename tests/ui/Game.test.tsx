import { cleanup, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Puzzle, Round } from '../../src/game/puzzle';
import type { Entity } from '../../src/data/schema';
import { Game } from '../../src/ui/Game';
import { loadSavedDays, type StorageLike } from '../../src/storage/progressStore';

afterEach(cleanup);

const TODAY = '2026-03-05';
const IDS = ['Ahri', 'Brand', 'Ciri', 'Dave'];

const entity = (id: string): Entity => ({
  id,
  name: id,
  iconUrl: `https://example.com/${id}.png`,
  stats: {},
});
const champions = new Map<string, Entity>(IDS.map((id) => [id, entity(id)]));
const ITEM_IDS = ['3031', '3089', '3157', '3003'];
const itemNames: Record<string, string> = {
  '3031': 'Infinity Edge',
  '3089': 'Rabadon Hat',
  '3157': 'Zhonya Glass',
  '3003': 'Archangel Staff',
};
const items = new Map<string, Entity>(
  ITEM_IDS.map((id) => [id, { ...entity(id), name: itemNames[id] ?? id }]),
);
const entities = { champion: champions, item: items };

const makeRound = (statLabel: string, answerId: string): Round => ({
  questionId: statLabel,
  subject: 'champion',
  statLabel,
  question: `Which champion has the highest ${statLabel.toLowerCase()}?`,
  format: { kind: 'number' },
  optionIds: IDS,
  answerId,
  values: { Ahri: 400, Brand: 300, Ciri: 200, Dave: 100 },
});

const puzzle: Puzzle = {
  date: TODAY,
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
      entities={entities}
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

  it('shows items by name and formats a percentage when a round is about items', async () => {
    const user = userEvent.setup();
    const itemPuzzle: Puzzle = {
      date: TODAY,
      rounds: [
        {
          questionId: 'itemGoldEfficiency',
          subject: 'item',
          statLabel: 'Gold efficiency',
          question: 'Which item is the most gold efficient?',
          format: { kind: 'percent' },
          optionIds: ITEM_IDS,
          answerId: '3031',
          values: { '3031': 103.6, '3089': 74.3, '3157': 95.4, '3003': 112.1 },
        },
      ],
    };
    render(
      <Game
        puzzle={itemPuzzle}
        entities={entities}
        date={TODAY}
        today={TODAY}
        storage={memoryStorage()}
        shareUrl="https://example.com/"
      />,
    );

    expect(screen.getByText('Which item is the most gold efficient?')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Infinity Edge/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Rabadon Hat/ }));
    expect(screen.getByText('103.6%')).toBeTruthy();
    expect(screen.getByText(/Not quite. It was Infinity Edge/)).toBeTruthy();
  });

  it('marks the right option without values when a round has no stat behind it', async () => {
    const user = userEvent.setup();
    const pickPuzzle: Puzzle = {
      date: TODAY,
      rounds: [
        {
          questionId: 'isMarksman',
          subject: 'champion',
          statLabel: 'Marksmen',
          question: 'Which of these champions is a marksman?',
          optionIds: IDS,
          answerId: 'Brand',
          values: {},
        },
      ],
    };
    render(
      <Game
        puzzle={pickPuzzle}
        entities={entities}
        date={TODAY}
        today={TODAY}
        storage={memoryStorage()}
        shareUrl="https://example.com/"
      />,
    );

    await user.click(screen.getByRole('button', { name: /Ahri/ }));
    expect(screen.getByText(/Not quite. It was Brand/)).toBeTruthy();
    expect(screen.getByText('Correct')).toBeTruthy();
    expect(document.querySelectorAll('.card__value')).toHaveLength(0);
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
        entities={entities}
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
        entities={entities}
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
        entities={entities}
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
        entities={entities}
        date="2026-03-04"
        today={TODAY}
        storage={storage}
        shareUrl="https://example.com/"
      />,
    );
    expect(screen.getByText(/Round 1 of 2/)).toBeTruthy();
  });
});
