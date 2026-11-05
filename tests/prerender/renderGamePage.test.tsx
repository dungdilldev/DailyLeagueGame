import { describe, expect, it } from 'vitest';
import { buildPuzzleDays } from '../../src/game/buildPuzzleDays';
import { renderGamePage } from '../../src/prerender/renderGamePage';
import { realGameData } from '../support/realGameData';

const TODAY = '2026-03-05';
const page = (mode: string) =>
  `<main class="game"><h1>Quiz</h1><div id="app" class="game__app" data-mode="${mode}"></div></main>`;

function embeddedJson(html: string): string {
  return /<script type="application\/json" id="puzzle-days">(.*?)<\/script>/s.exec(html)?.[1] ?? '';
}

describe('renderGamePage', () => {
  const html = renderGamePage(page('lore'), realGameData, TODAY);
  const days = buildPuzzleDays(realGameData, 'lore', TODAY);
  const firstRound = days[0]?.puzzle.rounds[0];

  it("puts round 1 of today's puzzle into the page as text crawlers can read", () => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const app = document.getElementById('app');
    expect(app?.querySelector('h2')?.textContent).toBe(firstRound?.question);
    expect(app?.querySelectorAll('.card')).toHaveLength(4);
    expect(app?.textContent).toContain('Round 1 of');
    // The answer is not marked: nothing has been picked yet.
    expect(app?.querySelector('.card--correct')).toBeNull();
  });

  it("embeds today's and tomorrow's puzzle for the app", () => {
    expect(JSON.parse(embeddedJson(html))).toEqual(days);
  });

  it('writes the JSON so that no question text can close its script early', () => {
    expect(embeddedJson(html)).not.toContain('<');
  });

  it('adds the script that hides round 1 from players who will see something else', () => {
    expect(html).toContain('dailyleague:v1:lore');
    expect(html).toContain('game__app--pending');
  });

  it('leaves pages without a game alone, and fails on an unknown mode', () => {
    expect(renderGamePage('<main><p>About</p></main>', realGameData, TODAY)).toBe(
      '<main><p>About</p></main>',
    );
    expect(() => renderGamePage(page('lroe'), realGameData, TODAY)).toThrow('Unknown game mode');
  });
});
