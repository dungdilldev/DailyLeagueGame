import { questionLabel, type Question } from '../data/questions';
import type { Coverage } from '../game/endlessCoverage';
import { ROUND_GAP_BANDS } from '../game/generate/config';
import { CATEGORY_LABELS, groupByCategory } from './categoryLabels';

interface CoveragePanelProps {
  questions: readonly Question[];
  coverage: Coverage;
}

/** Shows which questions and difficulties have come up so far, so gaps are easy to spot. */
export function CoveragePanel({ questions, coverage }: CoveragePanelProps) {
  const seen = questions.filter((question) => (coverage.asked[question.id] ?? 0) > 0).length;

  return (
    <section class="coverage" aria-labelledby="coverage-heading">
      <h2 id="coverage-heading">Coverage</h2>
      <p>
        <strong>
          {seen} of {questions.length}
        </strong>{' '}
        questions seen
      </p>

      {groupByCategory(questions).map((group) => {
        const seenInGroup = group.questions.filter(
          (question) => (coverage.asked[question.id] ?? 0) > 0,
        ).length;
        return (
          <div key={group.category}>
            <h3>
              {CATEGORY_LABELS[group.category]}{' '}
              <span class="coverage__subject">
                ({seenInGroup} of {group.questions.length} seen)
              </span>
            </h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Question</th>
                  <th scope="col">Asked</th>
                  <th scope="col">Correct</th>
                </tr>
              </thead>
              <tbody>
                {group.questions.map((question) => {
                  const asked = coverage.asked[question.id] ?? 0;
                  return (
                    <tr key={question.id} class={asked === 0 ? 'coverage__missing' : undefined}>
                      <th scope="row">
                        {questionLabel(question)}{' '}
                        <span class="coverage__subject">({question.subject})</span>
                        {asked === 0 && <span class="coverage__flag"> not seen yet</span>}
                      </th>
                      <td>{asked}</td>
                      <td>{coverage.correct[question.id] ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <p>
        Difficulty (1 easiest, {ROUND_GAP_BANDS.length} hardest):{' '}
        {coverage.bands.map((count, index) => `${String(index + 1)}: ${String(count)}`).join(' · ')}
      </p>
    </section>
  );
}
