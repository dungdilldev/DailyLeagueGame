import { abilityIconUrl, championIconUrl, itemIconUrl } from '../sources/dataDragon';
import type { AbilityStatInput, ItemStatInput, StatInput } from '../stats/types';
import { iconPath } from './iconPaths';
import type { IconSource } from './syncIcons';

interface IconInputs {
  champions: readonly Pick<StatInput, 'summary'>[];
  items: readonly Pick<ItemStatInput, 'item'>[];
  abilities: readonly Pick<AbilityStatInput, 'id' | 'spell'>[];
}

/** Where Data Dragon serves each entity's icon, and where our copy of it goes. */
export function iconSources(version: string, inputs: IconInputs): IconSource[] {
  return [
    ...inputs.champions.map(({ summary }) => ({
      path: iconPath('champions', summary.id),
      url: championIconUrl(version, summary),
    })),
    ...inputs.items.map(({ item }) => ({
      path: iconPath('items', item.id),
      url: itemIconUrl(version, item),
    })),
    ...inputs.abilities.map((input) => ({
      path: iconPath('abilities', input.id),
      url: abilityIconUrl(version, input.spell),
    })),
  ];
}
