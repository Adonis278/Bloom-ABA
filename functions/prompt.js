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
  next: 'The student just finished the previous step. Give the next physical action toward the assignment.',
  too_big:
    'The student said the last step was too big. Keep the same goal, but make it smaller — less of it, not a different task.',
  silent_stall:
    'The student has been stuck without saying anything. Drop the demand — smaller, more literal, or fewer choices than the last step.',
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

export function buildPrompt({ assignment, workSoFar, completedSteps, promptLevel, reason, retryHint }) {
  const level = LEVEL_SPEC[promptLevel] ?? LEVEL_SPEC[0];
  const why = REASON_SPEC[reason] ?? REASON_SPEC.next;

  const system = [
    'Give ONE next physical action for a student with ADHD, grades 6-9.',
    '',
    `PROMPT_LEVEL ${promptLevel}: ${level}`,
    `REASON: ${why}`,
    '',
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

  const user = [
    `ASSIGNMENT: ${assignment}`,
    workSoFar ? `WORK SO FAR: ${workSoFar}` : null,
    `COMPLETED STEPS:\n${done}`,
  ]
    .filter((line) => line !== null)
    .join('\n\n');

  return { system, user };
}
