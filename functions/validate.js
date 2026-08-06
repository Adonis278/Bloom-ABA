/* Step validation gate — CLAUDE.md "Step generation rules".

   Every generated step must: name one physical action starting with a verb,
   be under 25 words, require zero decisions, and contain none of decide,
   choose, think about, consider, pick which.

   This also enforces a floor, not just the ceiling in the doc. Measured
   during the scaffold session: the tier-2 fallback model returned the single
   word "Bend." for a first-step prompt. It passes every rule as written —
   under 25 words, starts with a verb, no decision word — and it is useless.
   A step must name an object, so reject anything under 4 words. */

const DECISION_WORDS = /\b(decide|choose|think about|consider|pick which)\b/i;

const VERB_START = new RegExp(
  '^(' +
    [
      'open', 'close', 'type', 'write', 'read', 'find', 'click', 'tap',
      'copy', 'paste', 'cut', 'print', 'fold', 'staple', 'save', 'draw',
      'circle', 'underline', 'highlight', 'number', 'label', 'bold',
      'indent', 'center', 'align', 'attach', 'upload', 'download', 'sign',
      'date', 'name', 'create', 'make', 'start', 'begin', 'add', 'insert',
      'select', 'bookmark', 'turn', 'flip', 'press', 'hold', 'erase',
      'scroll', 'move', 'drag', 'delete', 'title', 'list', 'jot', 'note',
      'mark', 'check', 'look', 'search', 'answer', 'fill', 'complete',
      'submit', 'rewrite', 'sit', 'stand', 'grab', 'pick', 'skim', 'reread',
      'scan', 'go', 'get', 'set', 'put', 'count', 'sort', 'gather', 'cross',
    ].join('|') +
    ')\\b',
  'i',
);

export function validateStep(raw) {
  const text = String(raw ?? '')
    .trim()
    // Strip wrapping quotes/markdown/bullets a model sometimes adds despite
    // "return ONLY the step text" — this is cleanup, not a validation check.
    .replace(/^[-*•]\s*/, '')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const problems = [];
  if (wordCount < 4) problems.push('too_short');
  if (wordCount > 25) problems.push('too_long');
  if (DECISION_WORDS.test(text)) problems.push('decision_word');
  if (text && !VERB_START.test(text)) problems.push('no_verb_start');
  if (!text) problems.push('too_short');

  return { text, words: wordCount, valid: problems.length === 0, problems };
}
