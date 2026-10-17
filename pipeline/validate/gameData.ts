import type { Question } from '../../src/data/questions';
import type { Entity, StatSubject } from '../../src/data/schema';
import type { StatBase } from '../stats/types';

/** Sanity floors: counts far below the real totals mean a partial or failed fetch. */
export const MIN_CHAMPION_COUNT = 100;
export const MIN_ITEM_COUNT = 30;
/**
 * Share of entities that must have each stat, unless the stat says otherwise. Not 100%: a
 * champion released today may be missing from a secondary source. Near-zero coverage means a
 * source broke, and fails the run.
 */
export const MIN_STAT_COVERAGE = 0.95;
/** Building a round needs four different values, so a stat needs comfortably more than that. */
export const MIN_VALUES_PER_STAT = 8;

function findDuplicateIds(label: string, entities: readonly { id: string }[]): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const { id } of entities) {
    if (seen.has(id)) problems.push(`Duplicate ${label} id "${id}"`);
    seen.add(id);
  }
  return problems;
}

/**
 * Returns human-readable problems with one data file's entities (all champions or all items);
 * empty means the data is safe to publish.
 */
export function findEntityProblems(
  noun: string,
  entities: readonly Entity[],
  stats: readonly StatBase[],
  minCount: number,
): string[] {
  const problems: string[] = [];
  if (entities.length < minCount) {
    problems.push(
      `Only ${String(entities.length)} ${noun}s, expected at least ${String(minCount)}`,
    );
  }
  problems.push(...findDuplicateIds(noun, entities));

  for (const stat of stats) {
    const withStat = entities.filter((entity) => stat.id in entity.stats).length;
    const required = Math.max(
      MIN_VALUES_PER_STAT,
      Math.ceil(entities.length * (stat.minCoverage ?? MIN_STAT_COVERAGE)),
    );
    if (withStat < required) {
      problems.push(
        `Stat "${stat.id}" present for only ${String(withStat)} of ${String(entities.length)} ${noun}s (need ${String(required)})`,
      );
    }
  }
  return problems;
}

/**
 * Problems in the hand-written questions that the data can reveal: explicit lists naming a
 * champion or item that no longer exists (e.g. removed from the game). Stat ids are checked when
 * the questions are resolved.
 */
export function findQuestionListProblems(
  questions: readonly Question[],
  knownIds: Readonly<Record<StatSubject, ReadonlySet<string>>>,
): string[] {
  return questions.flatMap((question) => {
    // Text options (team names, cities) are not in any data file, so there is nothing to check.
    if (question.subject === 'text') return [];
    const known = knownIds[question.subject];
    // Clue questions only have an exclude list.
    const listed = [
      ...('correct' in question ? (question.correct ?? []) : []),
      ...('wrong' in question ? (question.wrong ?? []) : []),
      ...(question.exclude ?? []),
    ];
    return listed
      .filter((id) => !known.has(id))
      .map((id) => `Question "${question.id}" lists unknown ${question.subject} id "${id}"`);
  });
}
