import { useState } from 'react';

/* One textarea, one Start button. Nothing else on screen — no nav, no logo,
   no persistent chrome (hard rule 3). */
export default function Entry({ onStart }) {
  const [assignment, setAssignment] = useState('');
  const canStart = assignment.trim().length > 0;

  function start() {
    if (!canStart) return;
    onStart(assignment.trim());
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-16">
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
