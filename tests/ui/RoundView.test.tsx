import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Entity } from '../../src/data/schema';
import type { Round } from '../../src/game/puzzle';
import { RoundView } from '../../src/ui/RoundView';

afterEach(cleanup);

const IDS = ['Valoran', 'Camavor', 'Arctic', 'Shurima'];
const options = new Map<string, Entity>(
  IDS.map((id) => [id, { id, name: id, iconUrl: '', stats: {} }]),
);
const EXPLANATION = 'A short note on why the answer is right.';

const round: Round = {
  questionId: 'continents',
  subject: 'text',
  statLabel: 'Continents',
  question: 'Which continent is described as an eastern continent of Runeterra?',
  optionIds: IDS,
  answerId: 'Camavor',
  values: {},
  explanation: EXPLANATION,
};

const show = (chosenId: string | undefined, shown: Round = round) =>
  render(
    <RoundView
      round={shown}
      roundNumber={1}
      totalRounds={5}
      options={options}
      chosenId={chosenId}
      onChoose={vi.fn()}
      onNext={vi.fn()}
    />,
  );

describe('RoundView answer text', () => {
  it('is hidden until the player has answered', () => {
    show(undefined);
    expect(screen.queryByText(EXPLANATION)).toBeNull();
  });

  it('is shown after a right and after a wrong answer', () => {
    show('Camavor');
    expect(screen.getByText(EXPLANATION)).toBeTruthy();
    cleanup();
    show('Shurima');
    expect(screen.getByText('Not quite. It was Camavor.')).toBeTruthy();
    expect(screen.getByText(EXPLANATION)).toBeTruthy();
  });

  it('is not shown for a round without one', () => {
    show('Camavor', { ...round, explanation: undefined });
    expect(document.querySelector('.feedback__explanation')).toBeNull();
  });
});
