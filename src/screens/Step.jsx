import { useEffect, useState } from 'react';
import Crossfade from '../components/Crossfade.jsx';

const READING_LINE = 'Reading it.';
const STILL_READING_LINE = 'Still reading.';
const SECOND_LINE_DELAY_MS = 7000;

/* The lit card. One step, two buttons: [Done] [Too big].

   Waiting states, hard rule 12: "If generation is pending, the previous
   step stays on screen unchanged." That is exactly what happens here for
   every regeneration after the first — `step` keeps rendering, only the
   buttons disable, nothing about the card's content changes.

   The one case the rule doesn't cover is the very first generation, where
   there is no previous step to hold. For that case only (`!step`), the card
   crossfades to a single flat line instead of a spinner — see CLAUDE.md
   "Waiting states" for why a spinner is wrong for this population. It's the
   one 450ms crossfade the motion budget allows, used twice: once into
   "Reading it.", once out into the step. */
export default function Step({ step, pending, onDone, onTooBig }) {
  const isFirstLoad = pending && !step;
  const [showSecondLine, setShowSecondLine] = useState(false);

  useEffect(() => {
    if (!isFirstLoad) {
      setShowSecondLine(false);
      return;
    }
    const t = setTimeout(() => setShowSecondLine(true), SECOND_LINE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isFirstLoad]);

  const phase = isFirstLoad ? (showSecondLine ? 'reading-2' : 'reading-1') : step;

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-16">
      <div className="card-lit w-full max-w-[620px] px-8 py-10">
        <div aria-live="polite">
          <Crossfade phase={phase}>
            {isFirstLoad ? (
              <p className="text-[1.0625rem] leading-[1.55] text-muted">
                {showSecondLine ? STILL_READING_LINE : READING_LINE}
              </p>
            ) : (
              <p className="text-step font-bold">{step}</p>
            )}
          </Crossfade>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={onDone}
            disabled={pending}
            className="tap rounded-lg border border-line px-5 text-[0.9375rem] font-bold disabled:opacity-40"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onTooBig}
            disabled={pending}
            className="tap rounded-lg border border-line px-5 text-[0.9375rem] disabled:opacity-40"
          >
            Too big
          </button>
        </div>
      </div>
    </main>
  );
}
