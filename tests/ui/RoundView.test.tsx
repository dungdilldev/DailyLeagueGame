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

describe('RoundView stat symbol', () => {
  const statRound: Round = {
    ...round,
    subject: 'champion',
    format: { kind: 'number' },
    unitIconUrl: 'images/stats/armor.png',
    values: { Valoran: 30, Camavor: 40, Arctic: 20, Shurima: 10 },
  };
  const symbols = () => [...document.querySelectorAll('.card__value .card__unit')];

  it('follows every value as its unit', () => {
    show('Camavor', statRound);
    expect(symbols().map((symbol) => symbol.getAttribute('src'))).toEqual(
      IDS.map(() => 'images/stats/armor.png'),
    );
  });

  it('is left out for a stat without one', () => {
    show('Camavor', { ...statRound, unitIconUrl: undefined });
    expect(symbols()).toEqual([]);
  });
});

describe('RoundView unit and details', () => {
  const perYearRound: Round = {
    ...round,
    subject: 'champion',
    format: { kind: 'number' },
    unit: 'skins per year',
    values: { Valoran: 1.5, Camavor: 2, Arctic: 1, Shurima: 0.5 },
    details: [
      {
        label: 'Skins',
        format: { kind: 'number' },
        values: { Valoran: 6, Camavor: 8, Arctic: 4, Shurima: 2 },
      },
    ],
  };
  const texts = (selector: string) =>
    [...document.querySelectorAll(selector)].map((element) => element.textContent);

  it("writes the unit after every value and each option's details under it", () => {
    show('Camavor', perYearRound);
    expect(texts('.card__value .card__unit-text')).toEqual(IDS.map(() => 'skins per year'));
    expect(texts('.card__detail')).toEqual(['Skins: 6', 'Skins: 8', 'Skins: 4', 'Skins: 2']);
    expect(document.querySelector('.card__details--hidden')).toBeNull();
  });

  it('keeps the details hidden until the player has answered', () => {
    show(undefined, perYearRound);
    expect(document.querySelectorAll('.card__details--hidden')).toHaveLength(IDS.length);
  });
});

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
