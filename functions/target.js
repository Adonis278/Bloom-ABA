/* How long is this assignment supposed to be, and where in it is the student?

   Without this the loop has no end: "write the next sentence" is always a
   valid next step, so the tool would keep asking for one forever. A target
   gives the loop a finish line, and — more usefully — lets the step change
   character near the end, from "keep building" to "write the ending".

   Read off the assignment text where it says so, with a plain default when
   it doesn't. This is a heuristic and deliberately a rough one; it decides
   when to switch to wrap-up language, not anything a student is graded on.

   IMPORTANT: this number never reaches the screen. CLAUDE.md hard rule 6
   forbids progress percentages — no bar, no "42 of 60 words", no counter.
   It exists to steer generation and to end the loop, nothing else. */

const DEFAULT_TARGET_WORDS = 120;
const WORDS_PER_PAGE = 250;

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

export function targetWordsFor(assignment) {
  const text = String(assignment ?? '').toLowerCase();

  // "at least 100 words", "100-150 words", "about 60 words"
  const explicit = text.match(/(\d+)\s*(?:[-–to]+\s*\d+\s*)?words?/);
  if (explicit) {
    const n = parseInt(explicit[1], 10);
    if (n > 0) return n;
  }

  // "one page", "two pages", "1 page"
  const pages = text.match(/\b(\d+|one|two|three|four|five)[\s-]*page/);
  if (pages) {
    const raw = pages[1];
    const n = NUMBER_WORDS[raw] ?? parseInt(raw, 10);
    if (n > 0) return n * WORDS_PER_PAGE;
  }

  if (/\bparagraphs\b/.test(text)) return 150;
  if (/\bparagraph\b/.test(text)) return 60;
  if (/\ba few sentences\b/.test(text)) return 40;

  return DEFAULT_TARGET_WORDS;
}

/* Phases, from the draft's own word count against that target:

     'building'  — still filling out the middle
     'ending'    — long enough that the missing piece is the conclusion
     'complete'  — target met and the last sentence is closed

   The ending phase starts before the target is reached on purpose: a student
   told to "write the ending" at exactly 100/100 words has already written
   past the point where an ending would have fit naturally. */
const ENDING_STARTS_AT = 0.85;

export function assignmentPhase({ wordCount, endsMidSentence, target }) {
  if (wordCount >= target) {
    // Never call it finished on a dangling sentence — the one remaining step
    // is to close that sentence.
    return endsMidSentence ? 'ending' : 'complete';
  }
  return wordCount >= target * ENDING_STARTS_AT ? 'ending' : 'building';
}
