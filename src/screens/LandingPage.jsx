import { useState } from 'react';

// Placeholder — swap in the real company name here. One constant, one place.
const COMPANY_NAME = 'Bloom';

/* The one surface allowed to look slightly different from the strict
   student tool — but "different" now means plain and calm, not a sales
   pitch. Marketing copy (a punchy tagline, a persuasive paragraph) was
   removed on request; what's left is the name, one flat sentence of what it
   does, and the sign-in action. Still governed by the same tone rules as
   everywhere else: no red, no exclamation marks, no sound that plays
   without an explicit action.

   Purely presentational — App.jsx owns the actual sign-in call and
   everything that happens after (the child picker, the welcome beat). */
export default function LandingPage({ onSignIn }) {
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setFailed(false);
    setWorking(true);
    try {
      await onSignIn();
    } catch {
      // Popup closed, blocked, or a network failure. No error state shown
      // (hard rule 1) — just let them try again.
      setWorking(false);
      setFailed(true);
    }
  }

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <section className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 pb-56 pt-24 text-center">
        <h1 className="text-[1.9rem] font-bold">{COMPANY_NAME}</h1>
        <p className="mt-3 max-w-xs text-[0.9375rem] leading-[1.55] text-muted">
          Helps you get started on schoolwork, one step at a time.
        </p>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center px-6">
        <div className="breathing card-lit pointer-events-auto w-full max-w-sm px-6 py-5 text-center">
          <p className="mb-3 text-[0.9375rem] text-muted">Start when you're ready.</p>
          <button
            type="button"
            onClick={handleClick}
            disabled={working}
            className="tap w-full rounded-lg border border-warm px-5 text-[0.9375rem] font-bold text-ink disabled:opacity-50"
          >
            {working ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {failed && (
            <p className="mt-3 text-[0.8125rem] text-muted">Didn't go through. Try again.</p>
          )}
        </div>
      </div>
    </main>
  );
}
