import { useEffect, useRef } from 'react';
import { computeStuckScore, isGateOpen, INTERVENE_THRESHOLD } from '../lib/scoring.js';

const TICK_MS = 1000;

/* Watches for silent stalling while a step is on screen — spec.md Part 2.
   Every ref here holds a count or a timestamp, never typed content
   (CLAUDE.md hard rule 7): keydown is used only to time keystrokes and
   classify Backspace/Delete, the same category as Entry.jsx's existing
   `e.key === 'Enter'` check. `workSoFar` itself is read only for its
   .length (netChars) and its trailing punctuation (the sentence-end gate)
   — never inspected, stored, or sent anywhere as a string from here.

   Per-step counters (keystrokes, deletes, tabAways, netChars) reset every
   time `step` changes, matching the per-step shape of
   sessions/{id}/steps/{stepId} in DESIGN.md. `onStall` fires at most once
   per step. */
export function useStuckDetector({ active, step, workSoFar, expectedSeconds, onStall }) {
  const stepStartRef = useRef(0);
  const lastKeyTimeRef = useRef(0);
  const keystrokesRef = useRef(0);
  const backspacesRef = useRef(0);
  const tabAwaysRef = useRef(0);
  const startLengthRef = useRef(0);
  const firstKeystrokeAtRef = useRef(null);
  const stalledRef = useRef(false);
  const rejectedRef = useRef(false);
  /* Deliberately NOT reset per step. Counts stalls the student never
     answered with a keystroke. Caught in live testing: after one stall the
     next step arrives, nothing is typed, and it stalls again on the same
     silence — walking the prompt level up to its maximum while nobody is
     there. One shrink is help; four in a row is talking to an empty chair.
     Any real keystroke clears this and re-arms the detector fully. */
  const unansweredStallsRef = useRef(0);
  const workSoFarRef = useRef(workSoFar);
  const onStallRef = useRef(onStall);

  workSoFarRef.current = workSoFar;
  onStallRef.current = onStall;

  useEffect(() => {
    const now = performance.now();
    stepStartRef.current = now;
    lastKeyTimeRef.current = now;
    keystrokesRef.current = 0;
    backspacesRef.current = 0;
    tabAwaysRef.current = 0;
    startLengthRef.current = (workSoFarRef.current ?? '').length;
    firstKeystrokeAtRef.current = null;
    stalledRef.current = false;
    rejectedRef.current = false;
  }, [step]);

  useEffect(() => {
    if (!active) return undefined;

    function onKeyDown(e) {
      lastKeyTimeRef.current = performance.now();
      if (firstKeystrokeAtRef.current === null) firstKeystrokeAtRef.current = lastKeyTimeRef.current;
      unansweredStallsRef.current = 0; // they're here — re-arm fully
      keystrokesRef.current += 1;
      if (e.key === 'Backspace' || e.key === 'Delete') backspacesRef.current += 1;
    }
    function onVisibilityChange() {
      if (document.hidden) tabAwaysRef.current += 1;
    }

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;

    const id = setInterval(() => {
      if (stalledRef.current) return;
      const now = performance.now();
      const secondsSinceLastKey = (now - lastKeyTimeRef.current) / 1000;
      const text = workSoFarRef.current ?? '';

      if (!isGateOpen({ secondsSinceLastKey, text })) return;

      const secondsOnStep = (now - stepStartRef.current) / 1000;
      const keystrokes = keystrokesRef.current;
      const backspaceRatio = keystrokes > 0 ? backspacesRef.current / keystrokes : 0;
      const netChars = text.length - startLengthRef.current;

      const score = computeStuckScore({
        secondsOnStep,
        expectedSeconds,
        secondsSinceLastKey,
        tabAwayCount: tabAwaysRef.current,
        backspaceRatio,
        netChars,
        keystrokes,
        rejectedThisStep: rejectedRef.current,
      });

      if (score >= INTERVENE_THRESHOLD) {
        stalledRef.current = true;
        // Nothing typed on this step, and the last stall also went
        // unanswered — they have left the desk. Shrinking again would only
        // burn prompt levels against silence.
        if (keystrokes === 0 && unansweredStallsRef.current >= 1) return;
        unansweredStallsRef.current += 1;
        onStallRef.current?.(score);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [active, expectedSeconds]);

  function noteReject() {
    rejectedRef.current = true;
    stalledRef.current = true; // the step is about to change; don't let this tick fire again
  }

  function getStepMetrics() {
    const now = performance.now();
    const text = workSoFarRef.current ?? '';
    return {
      latencyMs: Math.round(now - stepStartRef.current),
      keystrokes: keystrokesRef.current,
      deletes: backspacesRef.current,
      netChars: text.length - startLengthRef.current,
      tabAways: tabAwaysRef.current,
      // Meaningful only on a session's first step — BRD's "seconds from
      // assignment on screen to first character." null when nothing was
      // typed on this step yet, or this step's already had a keystroke
      // counted before getStepMetrics() is first called.
      firstKeystrokeMs:
        firstKeystrokeAtRef.current !== null
          ? Math.round(firstKeystrokeAtRef.current - stepStartRef.current)
          : null,
    };
  }

  return { noteReject, getStepMetrics };
}
