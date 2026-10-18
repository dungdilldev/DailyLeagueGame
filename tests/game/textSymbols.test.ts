import { describe, expect, it } from 'vitest';
import type { Round } from '../../src/game/puzzle';
import { roundSymbols } from '../../src/game/textSymbols';

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

describe('roundSymbols', () => {
  it('gives every option its crest when all of them have one', () => {
    const symbols = roundSymbols(textRound(['Demacia', 'Noxus', 'Shadow Isles', 'The Black Rose']));
    expect(symbols?.urls).toEqual({
      Demacia: 'https://wiki.leagueoflegends.com/en-us/images/Demacia_Crest_icon.png',
      Noxus: 'https://wiki.leagueoflegends.com/en-us/images/Noxus_Crest_icon.png',
      'Shadow Isles': 'https://wiki.leagueoflegends.com/en-us/images/Shadow_Isles_Crest_icon.png',
      'The Black Rose': 'https://wiki.leagueoflegends.com/en-us/images/Black_Rose_Crest_icon.png',
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
