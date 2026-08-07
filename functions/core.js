import { generate } from './providers/index.js';
import { buildPrompt, buildRetryHint } from './prompt.js';
import { validateStep } from './validate.js';
import { mapDraft } from './draftMap.js';
import { targetWordsFor, assignmentPhase } from './target.js';

/* Split from index.js so this logic is testable without a deployed or
   emulated onCall wrapper — just call runGenerateStep(input, keys) directly. */

const MAX_ATTEMPTS = 3; // 1 try + 2 regenerations. CLAUDE.md caps it here.
const FALLBACK_STEP = 'Open the document you are working on.';

function scoreCandidate(candidate) {
  // Fewer broken rules wins. Among ties, prefer word counts close to a
  // natural, plainly-spoken instruction over either extreme.
  const target = 11;
  return candidate.problems.length * 100 + Math.abs(candidate.words - target);
}

export async function runGenerateStep(input, keys) {
  const {
    assignment,
    workSoFar = '',
    completedSteps = [],
    promptLevel = 0,
    reason = 'next',
  } = input ?? {};

  /* The loop needs a finish line. Without one "write the next sentence" is
     forever a valid next step, so the tool would keep asking for one after
     the assignment is genuinely done. Checked before any model call — when
     it's finished there is nothing to generate, and no reason to spend the
     latency or the tokens finding that out. */
  const map = mapDraft(workSoFar);
  if (map && reason !== 'first') {
    const phase = assignmentPhase({
      wordCount: map.wordCount,
      endsMidSentence: map.endsMidSentence,
      target: targetWordsFor(assignment),
    });
    if (phase === 'complete') return { step: null, complete: true };
  }

  let best = null;
  let retryHint = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { system, user } = buildPrompt({
      assignment,
      workSoFar,
      completedSteps,
      promptLevel,
      reason,
      retryHint,
    });

    let raw;
    try {
      const result = await generate({ system, user, keys });
      raw = result.text;
    } catch {
      // Whole provider chain failed this attempt (every tier down or every
      // key missing). Nothing to validate — try again if budget remains.
      continue;
    }

    const checked = validateStep(raw);
    if (!best || scoreCandidate(checked) < scoreCandidate(best)) best = checked;
    if (checked.valid) return { step: checked.text, complete: false };

    retryHint = buildRetryHint(checked.problems);
  }

  /* Every attempt either failed outright or came back invalid.
     Hard rule 1: there is no error state. This function always resolves to
     a step a student can act on — the least-wrong candidate seen, or the
     fixed fallback if the provider chain never returned text at all. */
  return { step: best ? best.text : FALLBACK_STEP, complete: false };
}
