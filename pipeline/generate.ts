import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { PuzzleSchema, type Puzzle } from '../src/data/puzzleSchema';
import { ChampionsFileSchema } from '../src/data/schema';
import { addUtcDays, formatUtcDate } from '../src/game/date';
import { buildPuzzle } from './generate/buildPuzzle';
import { STAT_REGISTRY } from './stats';
import { findPuzzleProblems } from './validate/puzzle';

const DATA_DIR = path.resolve('public/data');
const CHAMPIONS_PATH = path.join(DATA_DIR, 'champions.json');
const PUZZLES_DIR = path.join(DATA_DIR, 'puzzles');
const DEFAULT_DAYS = 30;

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writePuzzle(puzzle: Puzzle): Promise<void> {
  const filePath = path.join(PUZZLES_DIR, `${puzzle.date}.json`);
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(puzzle, null, 2)}\n`);
  await rename(tempPath, filePath);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      days: { type: 'string', default: String(DEFAULT_DAYS) },
      from: { type: 'string', default: formatUtcDate(new Date()) },
    },
  });
  const days = Number(values.days);
  if (!Number.isInteger(days) || days < 1) throw new Error(`Invalid --days "${values.days}"`);

  const data = ChampionsFileSchema.parse(JSON.parse(await readFile(CHAMPIONS_PATH, 'utf8')));
  await mkdir(PUZZLES_DIR, { recursive: true });

  let created = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = addUtcDays(values.from, offset);
    // Published days are never regenerated: players may already have played them.
    if (await exists(path.join(PUZZLES_DIR, `${date}.json`))) continue;

    const puzzle = PuzzleSchema.parse(buildPuzzle(date, data, STAT_REGISTRY));
    const problems = findPuzzleProblems(puzzle, data);
    if (problems.length > 0) {
      throw new Error(`Refusing to write invalid puzzle for ${date}:\n- ${problems.join('\n- ')}`);
    }
    await writePuzzle(puzzle);
    created++;
  }
  console.log(`Created ${String(created)} puzzle(s); ${String(days - created)} already existed.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
