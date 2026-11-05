import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import type { PuzzleDay } from '../../src/game/puzzleDays';
import { DailyPage } from '../../src/ui/DailyPage';
import { readPuzzleDays } from '../../src/ui/embeddedPuzzleDays';

afterEach(cleanup);

const DAY: PuzzleDay = {
  puzzle: {
    date: '2026-03-05',
    rounds: [
      {
        questionId: 'cities',
        subject: 'text',
        statLabel: 'Cities',
        question: 'Which city hosted the final?',
        optionIds: ['Seoul', 'Berlin', 'Paris', 'London'],
        answerId: 'Seoul',
        values: {},
      },
    ],
  },
  options: { champion: {}, item: {}, ability: {}, text: {} },
};

describe('DailyPage', () => {
  it('plays the day it is given, with the mode links above it', () => {
    render(<DailyPage mode="esports" day={DAY} isToday storage={undefined} shareUrl="" />);
    expect(screen.getByRole('heading', { name: 'Which city hosted the final?' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Choose game mode' })).toBeTruthy();
    expect(screen.queryByText(/not out yet/)).toBeNull();
  });

  it('says so when it shows another day because today has no puzzle yet', () => {
    render(<DailyPage mode="esports" day={DAY} isToday={false} storage={undefined} shareUrl="" />);
    expect(screen.getByText(/not out yet/).textContent).toContain('Thu, Mar 5, 2026');
  });
});

describe('readPuzzleDays', () => {
  const pageWith = (script: string) =>
    new DOMParser().parseFromString(`<body>${script}</body>`, 'text/html');

  it('reads the puzzles the build put into the page', () => {
    const json = JSON.stringify([DAY]);
    const document = pageWith(`<script type="application/json" id="puzzle-days">${json}</script>`);
    expect(readPuzzleDays(document)).toEqual([DAY]);
  });

  it('gives none for a page without them, or with something unreadable', () => {
    expect(readPuzzleDays(pageWith(''))).toEqual([]);
    expect(
      readPuzzleDays(pageWith('<script type="application/json" id="puzzle-days">{oops</script>')),
    ).toEqual([]);
  });
});
