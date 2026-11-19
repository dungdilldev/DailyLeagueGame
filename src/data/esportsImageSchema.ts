import { z } from 'zod';
import type { EsportsImageFile } from './esportsImages';

const ImageNamesSchema = z.record(z.string(), z.string().min(1));

/** The shape of `data/esportsImages.json`; kept out of `esportsImages.ts`, which the browser loads. */
export const EsportsImageFileSchema = z.strictObject({
  leagues: ImageNamesSchema,
  teams: ImageNamesSchema,
  players: ImageNamesSchema,
}) satisfies z.ZodType<EsportsImageFile>;
