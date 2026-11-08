import { describe, expect, it } from 'vitest';
import { displayNameLines, joinAbilityName } from '../../src/data/abilityName';

describe('displayNameLines', () => {
  it('puts an ability owner and its name on two lines', () => {
    expect(displayNameLines(joinAbilityName('Tahm Kench Q', 'Tongue Lash'))).toEqual([
      'Tahm Kench Q',
      'Tongue Lash',
    ]);
  });

  it('keeps any other name on one line', () => {
    expect(displayNameLines('Ahri')).toEqual(['Ahri']);
  });

  it('splits at the first separator only', () => {
    expect(displayNameLines('Ahri Q · A · B')).toEqual(['Ahri Q', 'A · B']);
  });

  it('keeps a name that starts or ends with the separator whole', () => {
    expect(displayNameLines(' · Charm')).toEqual([' · Charm']);
    expect(displayNameLines('Ahri E · ')).toEqual(['Ahri E · ']);
  });
});
