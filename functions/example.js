import { generate } from './providers/index.js';
import { mapDraft, describeDraft } from './draftMap.js';

/* A concrete example of the step's output — "here is what one looks like" —
   shown only when the student is already stuck (a stall or a rejected step),
   never on a step they are moving through fine.

   Deliberately a SECOND, separate call rather than extra fields on
   generateStep. Two reasons, both practical: the step must never wait on
   this (it renders immediately, the example arrives after), and the step
   prompt is already at the edge of the tier-1 latency budget — see CLAUDE.md
   "Step generation rules". A failure here returns null and the UI simply
   shows no example.

   Tone rules are the same as everywhere else: flat, flat, flat. No praise,
   no exclamation marks, and it must not tell them their work is good. */

const EXAMPLE_SYSTEM = [
  'A student with ADHD (grades 6-9) is stuck on one small writing step.',
  'Write ONE example of what doing that step could look like — the actual words they could put on the page.',
  '',
  'Rules, all mandatory:',
  '- Give the example only. No preamble, no label, no quotes, no explanation.',
  '- One sentence, 20 words or fewer, plain grade-5 language.',
  '- It must fit their draft: same subject, same voice, first person if theirs is.',
  '- Use ONLY names and details they already wrote. Never invent a place, person, or event they did not mention.',
  '- It is a sample they can copy or change, not instructions and not a description.',
  '- No praise, no encouragement, no exclamation marks. Flat and plain.',
].join('\n');

const MAX_EXAMPLE_WORDS = 20;

/* Rejects the model explaining instead of demonstrating. An example that
   starts "You could write about..." is instructions wearing an example's
   clothes, and gives the student one more thing to decode.

   Deliberately matches whole instructional openers, not bare pronouns. An
   earlier version rejected anything starting with "it", "this", or "here",
   which threw away perfectly good sentences — a student writing "It was
   scary at first" is exactly the voice we want, and the example silently
   never appeared. Observed live. */
const META_START =
  /^(you (could|can|might|should)|try (to|writing)|think about|remember to|start by|for example|example\b|here('s| is)|write about)/i;

export function validateExample(raw) {
  const text = String(raw ?? '')
    .trim()
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/^(example|for example)\s*[:\-]\s*/i, '')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();

  if (!text) return null;
  if (text.split(/\s+/).filter(Boolean).length > MAX_EXAMPLE_WORDS) return null;
  if (text.includes('!')) return null;
  if (META_START.test(text)) return null;
  return text;
}

export async function runGenerateExample(input, keys) {
  const { assignment, workSoFar = '', step } = input ?? {};
  if (!step) return { example: null };

  const map = mapDraft(workSoFar);
  const user = [
    `ASSIGNMENT: ${assignment}`,
    map ? `THEIR DRAFT SO FAR: ${describeDraft(map)}` : null,
    /* The whole draft when it is small enough to afford, not just the tail.
       Measured live: with only the last 240 characters, the model wrote "We
       rented a little boat on Lake Tahoe" for a student whose draft says
       Lake Anna — the name sat earlier in the draft, outside the window, so
       it invented one. An example that contradicts their own page is worse
       than no example. */
    workSoFar ? `THEIR DRAFT (use these names, invent none):\n${workSoFar.trimEnd().slice(-1200)}` : null,
    `THE STEP THEY ARE STUCK ON: ${step}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const { text } = await generate({
      system: EXAMPLE_SYSTEM,
      user,
      keys,
      maxTokens: 60,
      temperature: 0.4,
    });
    return { example: validateExample(text) };
  } catch {
    // Hard rule 1: no error state. No example is a fine outcome — the step
    // itself is already on screen and still actionable without one.
    return { example: null };
  }
}
