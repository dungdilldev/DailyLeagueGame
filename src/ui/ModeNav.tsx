import { GAME_MODES, type GameMode } from '../game/gameMode';
import { Icon } from './icons';
import { MODE_LABELS } from './modeLabels';

interface ModeNavProps {
  mode: GameMode;
  /** Modes whose puzzle of the day shown is finished: their button gets a check mark. */
  finished?: readonly GameMode[];
  onChange: (mode: GameMode) => void;
}

/** One button per game mode: the mixed puzzle, or the questions of a single category. */
export function ModeNav({ mode, finished = [], onChange }: ModeNavProps) {
  return (
    <nav class="mode-nav" aria-label="Choose game mode">
      {GAME_MODES.map((option) => (
        <button
          key={option}
          type="button"
          class={`mode-nav__button${option === mode ? ' mode-nav__button--active' : ''}`}
          aria-pressed={option === mode}
          onClick={() => {
            onChange(option);
          }}
        >
          {MODE_LABELS[option]}
          {finished.includes(option) && (
            <>
              <Icon name="check" size={14} />
              <span class="visually-hidden">, finished</span>
            </>
          )}
        </button>
      ))}
    </nav>
  );
}
