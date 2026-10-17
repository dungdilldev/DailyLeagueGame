import { describe, expect, it } from 'vitest';
import { buildShareText } from '../../src/game/share';

describe('buildShareText', () => {
  it('shows the score and one square per round without revealing answers', () => {
    expect(buildShareText('2026-03-05', [true, true, false, true, false])).toBe(
      "Summoner's Quiz 2026-03-05 3/5\n\u{1F7E9}\u{1F7E9}\u{1F7E5}\u{1F7E9}\u{1F7E5}",
    );
  });

  it('names the mode when it is not the mixed one', () => {
    expect(buildShareText('2026-03-05', [true, false], undefined, 'Lore')).toBe(
      "Summoner's Quiz Lore 2026-03-05 1/2\n\u{1F7E9}\u{1F7E5}",
    );
  });

  it('appends the url when given', () => {
    expect(buildShareText('2026-03-05', [true], 'https://example.com')).toContain(
      '\nhttps://example.com',
    );
  });
});
