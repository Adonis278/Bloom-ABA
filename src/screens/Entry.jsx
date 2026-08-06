import { useState } from 'react';

/* One textarea, one Start button. Nothing else competes for attention here
   (hard rule 3) — the one exception is a small "My work" link, added when
   accounts became real. It's text-only, muted, and lives in a corner
   specifically on Entry and not on Step: Entry is "about to start," Step is
   "in the middle of it," and the in-task screen keeps its original,
   unmodified one-focal-element purity. See CLAUDE.md "Landing page &
   account model". */
export default function Entry({ onStart, onMyWork }) {
  const [assignment, setAssignment] = useState('');
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
