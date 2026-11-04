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

  it('keeps an earlier day when switching mode', () => {
    render(<ModeNav mode="stats" archiveDate="2026-03-04" />);
    expect(screen.getByRole('link', { name: 'Trivia' }).getAttribute('href')).toBe(
      'trivia.html?date=2026-03-04',
    );
  });

  it('marks the finished modes, and says so to screen readers', () => {
    render(<ModeNav mode="stats" finished={['lore']} />);
    expect(screen.getByRole('link', { name: 'Lore, finished' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Stats' })).toBeTruthy();
  });
});
