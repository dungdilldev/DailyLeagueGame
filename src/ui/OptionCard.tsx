import { displayNameLines } from '../data/abilityName';

export type CardState = 'idle' | 'correct' | 'wrong' | 'other';

interface OptionCardProps {
  name: string;
  iconUrl: string | undefined;
  /** A region or group crest rather than a portrait: drawn without the portrait frame. */
  isSymbol?: boolean;
  /** Stat value as display text; its line is always reserved so revealing it moves nothing. */
  valueText: string | undefined;
  /** The stat's symbol, drawn after the value as its unit. */
  unitIconUrl?: string | undefined;
  /** False until the player has answered: the value takes up space but is invisible. */
  valueRevealed: boolean;
  state: CardState;
  /** Label shown under the right option and the player's wrong pick once revealed. */
  tag: string | undefined;
  disabled: boolean;
  onSelect: () => void;
}

export function OptionCard({
  name,
  iconUrl,
  isSymbol = false,
  valueText,
  unitIconUrl,
  valueRevealed,
  state,
  tag,
  disabled,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      class={`card card--${state}${iconUrl ? '' : ' card--plain'}`}
      disabled={disabled}
      onClick={onSelect}
    >
      {iconUrl && (
        <img
          class={isSymbol ? 'card__icon card__icon--symbol' : 'card__icon'}
          src={iconUrl}
          alt=""
          width={96}
          height={96}
        />
      )}
      <span class="card__name">
        {displayNameLines(name).map((line) => (
          <span key={line} class="card__name-line">
            {line}
          </span>
        ))}
      </span>
      {valueText !== undefined && (
        <span class={valueRevealed ? 'card__value' : 'card__value card__value--hidden'}>
          {valueText}
          {/* The question names the stat, so the symbol adds nothing for screen readers. */}
          {unitIconUrl && (
            <img class="card__unit" src={unitIconUrl} alt="" width={18} height={18} />
          )}
        </span>
      )}
      {/* Always takes its line, like the value, so the cards keep their size on reveal. */}
      <span class={tag ? 'card__tag' : 'card__tag card__tag--empty'} aria-hidden={!tag}>
        {tag}
      </span>
    </button>
  );
}
