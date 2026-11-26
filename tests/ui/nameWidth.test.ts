import { describe, expect, it } from 'vitest';
import { longestWordEm } from '../../src/ui/nameWidth';

describe('longestWordEm', () => {
  it('measures the widest word, not the longest name', () => {
    const cheatCode = longestWordEm(['thereisnourflevel']);
    expect(longestWordEm(['All Random Ultra Rapid Fire'])).toBeLessThan(cheatCode);
  });

  it('takes the widest word across all names', () => {
    expect(longestWordEm(['ARAM', 'poweroverwhelming', 'motherlode'])).toBe(
      longestWordEm(['poweroverwhelming']),
    );
  });

  it('counts wide letters wider than narrow ones of the same count', () => {
    expect(longestWordEm(['MMMM'])).toBeGreaterThan(longestWordEm(['iiii']));
  });

  it('is 0 without any words', () => {
    expect(longestWordEm([])).toBe(0);
    expect(longestWordEm([''])).toBe(0);
  });
});
