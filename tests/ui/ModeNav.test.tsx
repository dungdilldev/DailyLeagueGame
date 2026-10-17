import { cleanup, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModeNav } from '../../src/ui/ModeNav';

afterEach(cleanup);

describe('ModeNav', () => {
  it('has a button for the mixed mode and each category, with the current one pressed', () => {
    render(<ModeNav mode="lore" onChange={vi.fn()} />);
    const names = screen.getAllByRole('button').map((button) => button.textContent);
    expect(names).toEqual(['Mixed', 'Stats', 'Lore', 'Esports']);
    expect(screen.getByRole('button', { name: 'Lore' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Mixed' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('reports the mode that was chosen', async () => {
    const onChange = vi.fn();
    render(<ModeNav mode="mixed" onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Esports' }));
    expect(onChange).toHaveBeenCalledWith('esports');
  });
});
