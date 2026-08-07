import { mapDraft, describeDraft } from './draftMap.js';
import { targetWordsFor, assignmentPhase } from './target.js';

/* Prompt construction — spec.md Part 3.

   STUDENT_RULES and STUDENT_WORLD are intentionally absent: there is no
   interest profile or rules box in this milestone (spec.md MVP list; F21/F22
   are later work). Everything here is driven by assignment, prior steps,
   prompt level, and reason only. */

const LEVEL_SPEC = {
  0: 'State the action. The student figures out how to do it.',
  1: 'State the action, and give the exact words the student should start with.',
  2: 'Give the literal words to write or type — five words or fewer.',
  3: 'Give three concrete options and have the student pick one. You are not asking them to invent an option.',
  4: 'Give the full text. The student copies it and changes exactly one word.',
};

const REASON_SPEC = {
  first:
    'This is the FIRST step of the assignment. It must be preparatory, not ' +
    'part of the assignment itself — open a document, write their name, ' +
    'write the date. A guaranteed win before any real demand.',
  next: 'The student finished the last step. Read their draft, find where it actually stops, and name the action that continues it from there.',
  too_big:
    'The student said the last step was too big. Keep the same goal, but make it smaller — less of it, not a different task.',
  silent_stall:
    'The student stalled silently. Give a SMALLER PIECE of the same next thing — one sentence instead of a paragraph, or its opening words. Lowering the demand means a smaller forward move, never a backward or passive one.',
};

/* The draft is the source of truth for where the student is — not the
   completed-step count. A student who wrote four sentences off one step is
   further along than the step list implies, and a step that ignores that
   restates work they already did. This is what makes the steps track the
   student rather than a fixed decomposition of the assignment; see
   CLAUDE.md "Reading the draft". */
// Ending mid-sentence is deterministically detectable (draftMap.js), and the
// right step in that case is never in doubt — so it's stated as an override
// rather than left for the model to infer. Measured: without this the models
// latch onto the dangling last word and produce off-task steps ("write the
// word 'scary' on a separate sheet of paper") for a student who only needed
// to finish their sentence.
const MID_SENTENCE_OVERRIDE = [
  'OVERRIDES EVERYTHING BELOW: the draft breaks off mid-sentence. The step is to finish that one sentence, continuing from the exact words in STOPPED HERE.',
  'Do not start a new sentence or paragraph, do not move elsewhere in the assignment, and do not single out its last word. Nothing goes on a separate sheet.',
  '',
];

/* Kept deliberately short. Every line here was added to fix a behaviour
   measured against the live models, and anything longer pushed generation
   past the tier-1 timeout — which silently downgrades to the flatter tier-2
   model and produces worse steps than the extra instruction buys back. */
const DRAFT_READING = [
  'Continue the draft from STOPPED HERE — that is exactly where they ran out.',
  'The draft, not the step list, says where they are. Never repeat or send them back to a part they already wrote.',
  'Never tell them to read, re-read, review, or think about what they wrote, and never send them to a dictionary, website, separate sheet, or other material. Everything happens on the page they are already writing on.',
  'Name their real subject — the thing their last line is actually about.',
];

// The tail is pulled out as its own field because position in a long draft
// is the thing the model gets wrong: given several paragraphs it anchors on
// early content and hands back a step for a section the student already
// finished. An explicit "you stopped here" marker fixes that far more
// reliably than asking it to infer position from the full text.
const TAIL_CHARS = 240;

function draftTail(text) {
  const trimmed = text.trimEnd();
  return trimmed.length <= TAIL_CHARS ? trimmed : `...${trimmed.slice(-TAIL_CHARS)}`;
}

const NO_DRAFT_NOTE =
  'The draft is empty. Give a step that gets the first words onto the page — the smallest real beginning, not planning or thinking.';

/* Replaces an earlier instruction that asked the model to judge for itself
   whether the draft was "long enough" — which it did unreliably, usually
   defaulting to "write the next sentence" forever. The phase is computed in
   target.js now, so the model is told which one it is instead of guessing.
   Shorter prompt AND a more reliable answer. */
const PHASE_SPEC = {
  building: null, // no extra instruction — the default guidance already covers it
  ending:
    'THE DRAFT IS NEARLY LONG ENOUGH. The missing piece is THE ENDING. The step is to write the closing sentence that wraps the whole piece up — a last thought about what it meant or how it turned out. Do not ask for more middle.',
  /* The draft is long enough but is not about the assignment. Steering back
     is delicate: the student has written a lot, and the step must not read as
     "that was wrong" (hard rule 1 — a step that didn't work is quietly
     replaced, never marked). So it names the assignment's actual subject and
     asks for one sentence on it, without judging what is already there. */
  redirect:
    'The draft has plenty of words but is not about the assignment. Do NOT mention that, do not say it is wrong, and do not ask them to delete or fix anything. Simply name what the assignment actually asks about and ask for ONE sentence on that subject.',
};

const RETRY_HINTS = {
  too_short: 'Your last answer was too vague. Name the exact thing to open, type, write, or find — not just the verb.',
  too_long: 'Your last answer was too long. Say it in 12 words or fewer this time.',
  decision_word: 'Do not use the words decide, choose, think about, consider, or pick which.',
  no_verb_start: 'Start the sentence with a physical verb: open, type, write, find, read, and so on.',
};

export function buildRetryHint(problems) {
  const lines = (problems ?? []).map((p) => RETRY_HINTS[p]).filter(Boolean);
  return lines.length ? lines.join(' ') : null;
}

export function buildPrompt({ assignment, workSoFar, completedSteps, promptLevel, reason, retryHint, phase }) {
  const level = LEVEL_SPEC[promptLevel] ?? LEVEL_SPEC[0];
  // Every REASON tells the model to continue the draft, which is the opposite
  // of what a redirect needs — so the phase overrides it rather than sitting
  // next to it contradicting itself.
  const why =
    phase === 'redirect'
      ? 'The student is writing about the wrong subject. Start them on the right one.'
      : (REASON_SPEC[reason] ?? REASON_SPEC.next);
  const hasDraft = Boolean(workSoFar?.trim());
  const map = hasDraft ? mapDraft(workSoFar) : null;

  /* core.js passes the phase in, because it has to compute one anyway to
     decide whether the loop ends and whether the draft is on topic — and
     'redirect' is only knowable there. Computing it here as a fallback keeps
     buildPrompt usable on its own. */
  const resolvedPhase =
    phase ??
    (map
      ? assignmentPhase({
          wordCount: map.wordCount,
          endsMidSentence: map.endsMidSentence,
          target: targetWordsFor(assignment),
        })
      : 'building');
  const phaseLine = PHASE_SPEC[resolvedPhase];

  /* 'redirect' REPLACES the draft-reading guidance rather than adding to it.
     That guidance says "continue from where the draft stops" — which is
     exactly wrong when the draft is about the wrong subject, and produced
     steps like "write the last sentence of the paragraph about summer break"
     for a draft about mitochondria. There is nothing here to continue. */
  const draftGuidance = !hasDraft
    ? [NO_DRAFT_NOTE]
    : resolvedPhase === 'redirect'
      ? [phaseLine]
      : [
          ...(map?.endsMidSentence ? MID_SENTENCE_OVERRIDE : []),
          ...(phaseLine ? [phaseLine] : []),
          ...DRAFT_READING,
        ];
  const readDraft = reason === 'first' ? [] : [...draftGuidance, ''];

  const system = [
    'Give ONE next physical action for a student with ADHD, grades 6-9.',
    '',
    `PROMPT_LEVEL ${promptLevel}: ${level}`,
    `REASON: ${why}`,
    '',
    ...readDraft,
    'Rules, all mandatory:',
    '- Name one physical action, starting with a verb (open, type, write, find, read, ...).',
    '- Completable in under 2 minutes.',
    '- Require zero decisions.',
    '- 25 words or fewer, and at least 4 words — name the object, not just the verb.',
    '- Never use the words: decide, choose, think about, consider, pick which.',
    '- No praise. No exclamation marks. Flat, plain tone.',
    '- Return ONLY the step text. No preamble, no quotes, no labels, no explanation.',
    retryHint ? `\nYour previous attempt broke a rule. ${retryHint}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const done = completedSteps?.length
    ? completedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '(nothing completed yet)';

  // Draft first, then the step list — the draft is the primary evidence of
  // where the student is, and the step list is only supporting context.
  /* On redirect the draft is withheld entirely. Measured: with the off-topic
     text still in the message the model anchors on it no matter what the
     instructions say — for a draft about mitochondria it produced "write a
     sentence that summarizes what you learned about cells", pushing the
     student further off the assignment. Removing just the STOPPED HERE tail
     was not enough; the verbatim block is the anchor. With nothing to anchor
     to, the only subject left in the prompt is the assignment itself. */
  const user =
    resolvedPhase === 'redirect'
      ? [
          `ASSIGNMENT: ${assignment}`,
          'The student has written a lot, but none of it is about this assignment. Ignore what is on their page — do not refer to it, continue it, or ask them to change it.',
          'Give one step that starts them on the assignment above: write ONE sentence about its actual subject.',
        ].join('\n\n')
      : [
          `ASSIGNMENT: ${assignment}`,
          hasDraft
            ? `WHAT THE STUDENT HAS WRITTEN SO FAR (verbatim):\n${workSoFar}`
            : 'WHAT THE STUDENT HAS WRITTEN SO FAR: (nothing on the page yet)',
          hasDraft ? `STRUCTURE: ${describeDraft(mapDraft(workSoFar))}` : null,
          hasDraft
            ? `STOPPED HERE — the writing runs out right after this:\n${draftTail(workSoFar)}`
            : null,
          `STEPS ALREADY GIVEN:\n${done}`,
        ]
          .filter((line) => line !== null)
    .join('\n\n');

  return { system, user };
}
