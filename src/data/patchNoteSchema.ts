import { z } from 'zod';
import { isValidUtcDate } from '../game/date';

const PatchNoteSchema = z.strictObject({
  date: z.string().refine(isValidUtcDate, 'must be a date written YYYY-MM-DD'),
  changes: z.array(z.string().trim().min(1)).min(1),
});

/** Newest first, one entry per day: the window lists them in file order. */
export const PatchNoteFileSchema = z
  .array(PatchNoteSchema)
  .refine(
    (notes) => notes.every((note, i) => i === 0 || note.date < (notes[i - 1]?.date ?? '')),
    'entries must be newest first, one per day',
  );
