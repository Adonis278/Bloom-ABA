import { useState } from 'react';

/* A real, ready-to-go assignment instead of a blank box — see CLAUDE.md
   "Premade assignment" for why. Still just the textarea's initial value;
   fully editable, not a fixture.

   Deliberately SHORT (60 words, not a page). The length written here is what
   target.js reads to decide when the assignment is finished, so a small
   target means a tester can reach the ending in a couple of minutes instead
   of writing a full page first. Change the number here and the finish line
   moves with it. */
const SAMPLE_ASSIGNMENT =
  'Write a short paragraph — about 60 words — about something you did over summer break. For English class, due Friday.';

/* One textarea, one Start button. Nothing else competes for attention here
   (hard rule 3) — the one exception is a small "My work" link, added when
   accounts became real. It's text-only, muted, and lives in a corner
   specifically on Entry and not on Step: Entry is "about to start," Step is
   "in the middle of it," and the in-task screen keeps its original,
   unmodified one-focal-element purity. See CLAUDE.md "Landing page &
   account model". */
export default function Entry({ onStart, onMyWork, onProgress, onDisplay }) {
  const [assignment, setAssignment] = useState(SAMPLE_ASSIGNMENT);
  const canStart = assignment.trim().length > 0;

  function start() {
    if (!canStart) return;
    onStart(assignment.trim());
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-16">
      {onMyWork && (
        <button
          type="button"
          onClick={onMyWork}
          className="tap fixed right-4 top-4 rounded-lg px-3 text-[0.8125rem] text-muted"
        >
          My work
        </button>
      )}
      {onProgress && (
        <button
          type="button"
          onClick={onProgress}
          className="tap fixed left-4 top-4 rounded-lg px-3 text-[0.8125rem] text-muted"
        >
          Progress
        </button>
      )}
      {onDisplay && (
        <button
          type="button"
          onClick={onDisplay}
          className="tap fixed bottom-4 right-4 rounded-lg px-3 text-[0.8125rem] text-muted"
        >
          Display
        </button>
      )}
      <div className="w-full max-w-[620px]">
        <label htmlFor="assignment" className="mb-6 block text-step font-bold">
          What do you have to do?
        </label>

        <textarea
          id="assignment"
          autoFocus
          rows={6}
          value={assignment}
          onChange={(e) => setAssignment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) start();
          }}
          placeholder="Paste it in, or type it."
          className="card-lit w-full resize-none px-5 py-4 text-[1.0625rem] leading-[1.55] text-ink outline-none placeholder:text-muted"
        />

        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className="tap mt-6 rounded-lg border border-line px-6 text-[0.9375rem] font-bold disabled:opacity-40"
        >
          Start
        </button>
      </div>
    </main>
  );
}
