import { useEffect, useState } from 'react';
import { computeChildAnalytics } from '../lib/analytics.js';
import TrendChart from '../components/TrendChart.jsx';

function pct(rate) {
  return rate === null ? null : Math.round(rate * 100);
}

function RateRow({ label, note, rate, detail }) {
  const value = pct(rate);
  return (
    <div className="border-t border-line py-5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[0.9375rem]">{label}</span>
        <span className="text-[0.9375rem] font-bold">{value === null ? '—' : `${value}%`}</span>
      </div>
      {note && <p className="mb-2 text-[0.75rem] text-muted">{note}</p>}
      <div className="h-2 w-full border border-line">
        {value !== null && <div className="h-full bg-ink" style={{ width: `${value}%` }} />}
      </div>
      {detail && <p className="mt-2 text-[0.75rem] text-muted">{detail}</p>}
    </div>
  );
}

/* Adult-facing analytics — DESIGN.md's reserved design language for this
   surface: font-mono, flat rows and hairlines, no card-lit (that's the
   student surface's treatment, not this one). Reached only from Entry's
   "Progress" link, same scoped-exception category as "My work" — never
   from Step.

   Computed live, client-side, from this child's own sessions/steps —
   see analytics.js for why this departs from DESIGN.md's original
   summaries/{uid} + Cloud Function architecture, and for the privacy
   boundary (only derived aggregates ever reach this component — never
   `target` or `assignmentText`, even though the adult already has read
   access to the raw docs those come from). */
export default function AdultView({ uid, childId, childName, onBack }) {
  const [data, setData] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    computeChildAnalytics(uid, childId).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, childId]);

  const isEmpty =
    data &&
    data.promptLevelSeries.length === 0 &&
    data.timeToFirstKeystroke.length === 0 &&
    data.completion.sessions.length === 0;

  return (
    <main className="min-h-dvh px-6 py-16 font-mono">
      <div className="mx-auto w-full max-w-[620px]">
        <div className="mb-8 flex items-center justify-between">
          <button type="button" onClick={onBack} className="tap rounded-lg px-3 text-[0.8125rem] text-muted">
            Back
          </button>
        </div>

        <h1 className="mb-1 text-[1.25rem] font-bold">
          {childName ? `${childName}'s progress` : 'Progress'}
        </h1>
        <p className="mb-8 text-[0.75rem] text-muted">
          Patterns only — never assignment or step content.
        </p>

        {data === null && <p className="text-[0.9375rem] text-muted">Loading.</p>}

        {isEmpty && <p className="text-[0.9375rem] text-muted">Nothing yet.</p>}

        {data && !isEmpty && (
          <>
            <div className="border-t border-line py-5">
              <p className="mb-3 text-[0.9375rem]">Prompt level over time</p>
              <p className="mb-3 text-[0.75rem] text-muted">
                Should trend toward 0 (independent) as fewer prompts are needed.
              </p>
              <TrendChart
                points={data.promptLevelSeries.map((p) => ({ x: p.t, y: p.level }))}
                yMin={0}
                yMax={4}
              />
            </div>

            <RateRow
              label="Stall recovery"
              note="Of steps that were auto-shrunk for stalling, how many were followed by a completed step."
              rate={data.stallRecovery.rate}
              detail={`${data.stallRecovery.recovered} of ${data.stallRecovery.total} shrunk steps`}
            />

            <RateRow
              label="Assignment completion"
              note="Proxy: sessions whose most recent step ended cleanly, not mid-reject or mid-stall. Not a true finish signal — this app has no explicit finish action yet."
              rate={data.completion.rate}
              detail={`${data.completion.sessions.filter((s) => s.completed).length} of ${data.completion.sessions.length} sessions`}
            />

            <div className="border-t border-b border-line py-5">
              <p className="mb-3 text-[0.9375rem]">Time to first keystroke</p>
              <p className="mb-3 text-[0.75rem] text-muted">
                Seconds from the assignment appearing to the first character typed, per session.
              </p>
              <TrendChart points={data.timeToFirstKeystroke.map((p) => ({ x: p.t, y: p.seconds }))} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
