import { generate } from './providers/index.js';

/* Is the draft actually about the assignment?

   Word count alone can end the loop on 60 words of something else entirely,
   which is the one way "That's the whole assignment." can be badly wrong.
   This is the check that stands between a finished draft and that screen.

   It is ONE classification call, not an agent. The question is bounded and
   its shape is known — there is nothing to explore, no sequence to discover,
   no tools to pick. An agent loop here would only multiply latency against a
   budget that already loses ~2 in 8 tier-1 calls to timeout, and every
   timeout drops generation to the flatter model. See CLAUDE.md "Model
   providers".

   BIASED TOWARD "ON TOPIC" ON PURPOSE. The two failure modes are not equal:
   letting a genuinely off-topic draft finish is a missed catch, but telling a
   student who did the work that it doesn't count is the exact experience this
   product exists to prevent. When the model is unsure, or the call fails, or
   the answer is unparseable, the student's work stands. */

const SYSTEM = [
  'Decide whether a student draft is about the assignment they were given.',
  '',
  'Answer with exactly one word, ON or OFF, and nothing else.',
  'ON  = the draft is an attempt at this assignment, even a rough, short, or unfinished one.',
  'OFF = the draft is clearly about something else entirely, or is filler, keyboard mashing, or copied instructions.',
  '',
  'Be generous. A messy, simple, or partial attempt is still ON.',
  'Different wording, a personal angle, or an unexpected topic choice is still ON if the assignment allowed a choice.',
  'Only answer OFF when there is no reasonable reading of the draft as this assignment.',
].join('\n');

const OFF_TOPIC_TIMEOUT_MS = 6000;

export async function isOnTopic({ assignment, workSoFar }, keys) {
  const draft = String(workSoFar ?? '').trim();
  if (!draft) return true; // nothing written is not off-topic

  const user = [`ASSIGNMENT: ${assignment}`, `STUDENT DRAFT:\n${draft.slice(-1500)}`].join('\n\n');

  try {
    const { text } = await generate({
      system: SYSTEM,
      user,
      keys,
      maxTokens: 5,
      temperature: 0,
    });
    // Only a clear, unambiguous OFF counts. Anything else — a hedge, an
    // explanation, an empty completion — leaves the work standing.
    return !/^\W*off\b/i.test(String(text ?? '').trim());
  } catch {
    return true;
  }
}

export { OFF_TOPIC_TIMEOUT_MS };
