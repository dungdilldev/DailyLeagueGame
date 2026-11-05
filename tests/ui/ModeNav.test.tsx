import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { ModeNav } from '../../src/ui/ModeNav';

afterEach(cleanup);

describe('ModeNav', () => {
  it('links to each mode page, with the current one marked', () => {
    render(<ModeNav mode="lore" />);
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Trivia',
      'Lore',
      'Stats',
      'Esports',
      'Mixed',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'trivia.html',
      'lore.html',
      'stats.html',
      'esports.html',
      'mixed.html',
    ]);
    expect(screen.getByRole('link', { name: 'Lore' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Mixed' }).getAttribute('aria-current')).toBeNull();
  });

  it('marks the finished modes, and says so to screen readers', () => {
    render(<ModeNav mode="stats" finished={['lore']} />);
    expect(screen.getByRole('link', { name: 'Lore, finished' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Stats' })).toBeTruthy();
  });
});
