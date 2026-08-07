/* Stall-detection math — spec.md Part 2 / DESIGN.md, coefficients verbatim.
   Pure functions only: no DOM, no React, nothing here reads or stores typed
   content — every input is a count or a timestamp. See
   useStuckDetector.js for what actually collects these numbers, and
   CLAUDE.md hard rule 7 for why that boundary matters. */

export const EXPECTED_SECONDS_DEFAULT = 90;
export const INTERVENE_THRESHOLD = 3.0;
export const PAUSE_GATE_SECONDS = 4;
export const SENTENCE_SETTLE_SECONDS = 1;

const SENTENCE_END_RE = /[.!?\n]\s*$/;

export function computeStuckScore({
  secondsOnStep,
  expectedSeconds,
  secondsSinceLastKey,
  tabAwayCount,
  backspaceRatio,
  netChars,
  keystrokes,
  rejectedThisStep,
}) {
  return (
    2.0 * (secondsOnStep / expectedSeconds) +
    1.5 * (secondsSinceLastKey / 30) +
    1.5 * tabAwayCount +
    1.0 * (backspaceRatio > 0.4 ? 1 : 0) +
    1.0 * (netChars <= 0 && keystrokes > 20 ? 1 : 0) +
    3.0 * (rejectedThisStep ? 1 : 0)
  );
}

// "Sentence boundaries or genuine pauses" (spec.md) — a concrete reading of
// that: either a real pause, or the draft looks finished and has settled.
// Score is only ever computed when this is true, never mid-sentence.
export function isGateOpen({ secondsSinceLastKey, text }) {
  if (secondsSinceLastKey >= PAUSE_GATE_SECONDS) return true;
  return SENTENCE_END_RE.test(text ?? '') && secondsSinceLastKey >= SENTENCE_SETTLE_SECONDS;
}

export function medianOf(samples) {
  if (!samples || samples.length === 0) return EXPECTED_SECONDS_DEFAULT;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
