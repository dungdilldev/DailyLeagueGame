import { DATA_DRAGON_SOURCE, type StatDefinition } from './types';

const DEFAULT_SKIN_NUMBER = 0;
/** Chromas and prestige editions are listed as "Name (Variant)" and are not counted as skins. */
const VARIANT_NAME_PATTERN = /\)$/;

export const skinCount: StatDefinition = {
  id: 'skinCount',
  label: 'Number of skins',
  question: 'Which champion has the most skins?',
  source: DATA_DRAGON_SOURCE,
  extract: ({ detail }) =>
    detail.skins.filter(
      (skin) => skin.num !== DEFAULT_SKIN_NUMBER && !VARIANT_NAME_PATTERN.test(skin.name),
    ).length,
};
