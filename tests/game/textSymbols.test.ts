import { describe, expect, it } from 'vitest';
import type { Round } from '../../src/game/puzzle';
import { clueImageUrl, roundSymbols } from '../../src/game/textSymbols';

function textRound(optionIds: string[]): Round {
  return {
    questionId: 'natFeudalMonarchy',
    subject: 'text',
    statLabel: 'Nations',
    question: 'Which nation is a feudal monarchy?',
    format: undefined,
    optionIds,
    answerId: optionIds[0] ?? '',
    values: {},
  };
}

describe('team logo clue', () => {
  const teams = ['T1', 'Fnatic', 'Cloud9', 'G2 Esports'];
  const logoRound: Round = { ...textRound(teams), questionId: 'teamByLogo', clue: 'teamLogo' };

  it("shows the answer's logo with the question", () => {
    expect(clueImageUrl(logoRound)).toContain('images/esports/teams/t1.webp');
  });

  it('shows no logos on the cards, which would answer the question', () => {
    expect(roundSymbols(textRound(teams))).toBeDefined();
    expect(roundSymbols(logoRound)).toBeUndefined();
  });

  it('shows nothing for rounds without a clue', () => {
    expect(clueImageUrl(textRound(teams))).toBeUndefined();
  });
});

describe('roundSymbols', () => {
  it('gives every option its crest when all of them have one', () => {
    const symbols = roundSymbols(textRound(['Demacia', 'Noxus', 'Shadow Isles', 'The Black Rose']));
    const crest = (file: string) => `images/crests/${file}`;
    expect(symbols?.urls).toEqual({
      Demacia: crest('demacia-crest-icon.png'),
      Noxus: crest('noxus-crest-icon.png'),
      'Shadow Isles': crest('shadow-isles-crest-icon.png'),
      'The Black Rose': crest('black-rose-crest-icon.png'),
    });
  });

  it('shows no crest at all when one option has none, so the odd card out is no hint', () => {
    expect(roundSymbols(textRound(['Demacia', 'Noxus', 'Ionia', 'Ixaocan']))).toBeUndefined();
  });

  it('shows nothing for places inside a nation, which would give away the answer', () => {
    expect(
      roundSymbols(textRound(['Wuju', 'Navori', 'Hirana Monastery', 'Fae’lor'])),
    ).toBeUndefined();
  });

  it('ignores champion and item rounds', () => {
    const round: Round = {
      ...textRound(['Demacia', 'Noxus', 'Ionia', 'Zaun']),
      subject: 'champion',
    };
    expect(roundSymbols(round)).toBeUndefined();
  });
});

describe('roundSymbols for esports rounds', () => {
  it('shows team logos and league logos as crests', () => {
    expect(roundSymbols(textRound(['T1', 'Gen.G', 'Cloud9', 'Fnatic']))?.kind).toBe('crest');
    expect(roundSymbols(textRound(['LCK', 'LPL', 'LEC', 'LCS']))?.kind).toBe('crest');
  });

  it('shows player photos, except where the jersey would answer the question', () => {
    const players = ['Faker', 'Uzi', 'Bjergsen', 'Doublelift'];
    expect(roundSymbols(textRound(players))?.kind).toBe('photo');
    expect(roundSymbols({ ...textRound(players), questionId: 'playerByTeam' })).toBeUndefined();
  });

  it('shows nothing for a round that mixes crests and photos or has an unknown name', () => {
    expect(roundSymbols(textRound(['T1', 'Faker', 'Gen.G', 'Fnatic']))).toBeUndefined();
    expect(roundSymbols(textRound(['T1', 'Gen.G', 'Fnatic', 'Not A Team']))).toBeUndefined();
  });
});
