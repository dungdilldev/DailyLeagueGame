import { GAME_MODES, type GameMode } from '../game/gameMode';
import { Icon } from './icons';
import { MODE_LABELS } from './modeLabels';
import { modePageHref } from './modePages';

interface ModeNavProps {
  mode: GameMode;
  /** Modes whose puzzle of today is finished: their link gets a check mark. */
  finished?: readonly GameMode[];
}

/** One link per game mode page: the mixed puzzle, or the questions of a single category. */
export function ModeNav({ mode, finished = [] }: ModeNavProps) {
  return (
    <nav class="mode-nav" aria-label="Choose game mode">
      {GAME_MODES.map((option) => (
        <a
          key={option}
          href={modePageHref(option)}
          class={`mode-nav__button${option === mode ? ' mode-nav__button--active' : ''}`}
          aria-current={option === mode ? 'page' : undefined}
        >
          {MODE_LABELS[option]}
          {finished.includes(option) && (
            <>
              <Icon name="check" size={14} />
              <span class="visually-hidden">, finished</span>
            </>
          )}
        </a>
      ))}
    </nav>
  );
}
