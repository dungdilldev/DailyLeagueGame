import { GAME_MODES, type GameMode } from '../game/gameMode';
import { MODE_LABELS } from './modeLabels';

interface ModeNavProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

/** One button per game mode: the mixed puzzle, or the questions of a single category. */
export function ModeNav({ mode, onChange }: ModeNavProps) {
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
        </button>
      ))}
    </nav>
  );
}
