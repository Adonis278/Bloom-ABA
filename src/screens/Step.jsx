import { useEffect, useRef, useState } from 'react';
import Crossfade from '../components/Crossfade.jsx';

const READING_LINE = 'Reading it.';
const STILL_READING_LINE = 'Still reading.';
const SECOND_LINE_DELAY_MS = 7000;

/* Browser TTS, not a cloud call — no key, no cost, no network dependency.
   spec.md F24 / accessibility spec: read-aloud must be explicit-action only,
   never auto-play (hard rule 5, N1). There is no synced word highlighting
   here — that's the fuller F24 scope; this is the read-the-step-aloud MVP
   of it. */
const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

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
   "Reading it.", once out into the step.

   The workspace textarea below the step is the first real text-input
   surface here — CLAUDE.md "Stall detection" records it as a deliberate,
   scoped decision, not drift from hard rule 3. `workSoFar` is owned by
   App.jsx (cumulative across the whole assignment, feeds the LLM); this
   component only renders it. It's hidden during the very first load since
   there's nothing to work on yet. */
export default function Step({ step, pending, onDone, onTooBig, workSoFar, onWorkSoFarChange, example }) {
  const isFirstLoad = pending && !step;
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!isFirstLoad) {
      setShowSecondLine(false);
      return;
    }
    const t = setTimeout(() => setShowSecondLine(true), SECOND_LINE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isFirstLoad]);

  // Never let read-aloud narrate a step the student has already left —
  // stop speaking the moment the step changes, whichever direction.
  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, [step]);

  function toggleReadAloud() {
    if (!speechSupported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(stepRef.current);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  function stopSpeakingThen(action) {
    if (speechSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
    action();
  }

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

        {/* Only present when the student is already stuck. Set apart by a
            hairline and muted label rather than a colour or a box — no red,
            no new hue, nothing that reads as a warning. The sample sentence
            itself is the one bold thing, so the eye lands on the words they
            can actually use. */}
        {!isFirstLoad && example && (
          <div className="mt-8 border-t border-line pt-5">
            <p className="mb-2 text-[0.8125rem] text-muted">One way it could look:</p>
            <p className="text-[1.0625rem] font-bold leading-[1.55] text-ink">{example}</p>
            <p className="mt-2 text-[0.8125rem] text-muted">Copy it, or change any part.</p>
          </div>
        )}

        {!isFirstLoad && (
          <textarea
            aria-label="Work here if you want to"
            rows={5}
            value={workSoFar}
            onChange={(e) => onWorkSoFarChange(e.target.value)}
            placeholder="Work here if you want to."
            /* Hard rule 1 reaches past our own CSS here. Observed in live
               testing: Grammarly attaches to this textarea and draws red
               squiggles under the student's sentences — exactly the
               corrective red-ink signal this product exists to avoid, on the
               one surface where they are being asked to take a risk. These
               three attributes turn off our spellcheck and opt the field out
               of Grammarly and Microsoft Editor. We cannot control every
               extension, but we can decline the common ones. */
            spellCheck="false"
            data-gramm="false"
            data-enable-grammarly="false"
            className="card-lit mt-6 w-full resize-none px-5 py-4 text-[0.9375rem] leading-[1.55] text-ink outline-none placeholder:text-muted"
          />
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => stopSpeakingThen(onDone)}
            disabled={pending}
            className="tap rounded-lg border border-line px-5 text-[0.9375rem] font-bold disabled:opacity-40"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => stopSpeakingThen(onTooBig)}
            disabled={pending}
            className="tap rounded-lg border border-line px-5 text-[0.9375rem] disabled:opacity-40"
          >
            Too big
          </button>
          {speechSupported && (
            <button
              type="button"
              onClick={toggleReadAloud}
              disabled={pending}
              aria-pressed={speaking}
              className="tap rounded-lg border border-line px-5 text-[0.9375rem] disabled:opacity-40"
            >
              {speaking ? 'Stop' : 'Listen'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
