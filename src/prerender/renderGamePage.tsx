import { renderToString } from 'preact-render-to-string';
import type { GameData } from '../data/questions';
import { buildPuzzleDays } from '../game/buildPuzzleDays';
import { GAME_MODES, progressSlot, type GameMode } from '../game/gameMode';
import { progressStorageKey } from '../storage/progressStore';
import { DailyPage } from '../ui/DailyPage';
import { PENDING_CLASS, PUZZLE_DAYS_ELEMENT_ID } from '../ui/embeddedPuzzleDays';

/** A game page's mount element, still empty; its `data-mode` names the page's mode. */
const APP_ELEMENT = /(<div id="app"[^>]*\bdata-mode="([a-z]+)"[^>]*>)(<\/div>)/;

function isGameMode(value: string): value is GameMode {
  return (GAME_MODES as readonly string[]).includes(value);
}

/** JSON that cannot end the `<script>` it sits in, whatever a question's text contains. */
function scriptSafeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

/**
 * Runs while the page is read, before it is first drawn: hides the built-in round 1 when the app
 * will show something else (this player's saved progress, or another day after midnight), so it
 * never flashes up. Plain old JavaScript, inline, with no access to the app's modules.
 */
function pendingScript(storageKey: string, builtDate: string): string {
  return `<script>
      (function () {
        try {
          var today = new Date().toISOString().slice(0, 10);
          var saved = JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || '{}')[today];
          if (today !== ${JSON.stringify(builtDate)} || (saved && saved.answers && saved.answers.length > 0)) {
            document.getElementById('app').classList.add(${JSON.stringify(PENDING_CLASS)});
          }
        } catch (error) {}
      })();
    </script>`;
}

/**
 * Builds the day into a game page: round 1 of today's puzzle as real markup inside `#app` (what a
 * first-time visitor sees, and what crawlers read), then today's and tomorrow's puzzle as JSON for
 * the app. Pages without a game are returned unchanged.
 */
export function renderGamePage(html: string, data: GameData, today: string): string {
  const match = APP_ELEMENT.exec(html);
  if (!match) return html;
  const [, openTag = '', modeName = '', closeTag = ''] = match;
  if (!isGameMode(modeName)) throw new Error(`Unknown game mode "${modeName}" on a game page`);

  const days = buildPuzzleDays(data, modeName, today);
  const [todays] = days;
  if (!todays) throw new Error(`No puzzle built for ${today}`);
  const markup = renderToString(
    <DailyPage mode={modeName} day={todays} isToday storage={undefined} shareUrl="" />,
  );
  const embedded = [
    pendingScript(progressStorageKey(progressSlot(modeName)), today),
    `<script type="application/json" id="${PUZZLE_DAYS_ELEMENT_ID}">${scriptSafeJson(days)}</script>`,
  ].join('\n    ');
  return html.replace(APP_ELEMENT, () => `${openTag}${markup}${closeTag}\n    ${embedded}`);
}
