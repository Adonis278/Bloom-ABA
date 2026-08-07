/* A deterministic structural read of the student's draft — the "where are
   they actually" map that the step generator reasons from.

   This is plain counting, not a model call. Asking the LLM to infer its own
   position inside several paragraphs of prose was measurably unreliable: it
   anchored on early content and handed back steps for sections the student
   had already finished. Facts it cannot misread fix that.

   Nothing here is stored or logged. workSoFar is already sent to the model
   as real product content (it is what the next step has to build on); this
   only summarizes it in transit, and the summary lives no longer than the
   request. CLAUDE.md hard rule 7 is about keystroke content, which this
   never touches. */

const SENTENCE_END = /[.!?]["')\]]?\s*$/;
const TITLE_MAX_WORDS = 8;

function words(text) {
  return text.split(/\s+/).filter(Boolean);
}

export function mapDraft(rawDraft) {
  const draft = (rawDraft ?? '').trim();
  if (!draft) return null;

  const blocks = draft
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  // A short opening block with no sentence-ending punctuation is a title,
  // not a paragraph — "My Summer at the Lake" shouldn't count as body text.
  const hasTitle =
    blocks.length > 1 &&
    words(blocks[0]).length <= TITLE_MAX_WORDS &&
    !SENTENCE_END.test(blocks[0]);

  const paragraphs = hasTitle ? blocks.slice(1) : blocks;

  /* A single short line with no ending punctuation is a name or a title, not
     a sentence someone abandoned halfway. Caught in live testing: a student
     who had typed just "Jerome" at the top of the page was told to "write
     the rest of the sentence about Jerome," because a bare name looks
     identical to a broken-off sentence by punctuation alone. Length is what
     separates them. */
  const lastBlock = blocks[blocks.length - 1];
  const looksLikeBareHeading =
    blocks.length === 1 && words(lastBlock).length <= TITLE_MAX_WORDS && !SENTENCE_END.test(lastBlock);
  const endsMidSentence = !SENTENCE_END.test(draft) && !looksLikeBareHeading;
  const sentenceCount = (draft.match(/[.!?]+/g) ?? []).length;

  return {
    hasTitle,
    paragraphCount: paragraphs.length,
    sentenceCount,
    wordCount: words(draft).length,
    endsMidSentence,
  };
}

export function describeDraft(map) {
  if (!map) return null;
  return [
    map.hasTitle ? 'Has a title.' : 'No title.',
    `${map.paragraphCount} paragraph(s) written, ${map.sentenceCount} sentence(s), ${map.wordCount} word(s) total.`,
    map.endsMidSentence
      ? 'The draft breaks off MID-SENTENCE — they stopped partway through a thought.'
      : 'The last sentence is finished, so they stopped between thoughts.',
  ].join(' ');
}
