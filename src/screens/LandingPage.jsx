import { useState } from 'react';

/* The one surface in this app allowed to look like a normal website.
   Everything past this point (Entry, Step) keeps the strict, motion-quiet,
   single-focal-element register CLAUDE.md's hard rules describe — this page
   is a deliberately different register, because its job is the opposite of
   the student tool's: make a first impression, draw attention, get someone
   to act. See CLAUDE.md "Landing page & account model" for the boundary.

   What still applies here, unchanged: no red, no exclamation marks, no
   sound that plays without an explicit action. Those are about respecting
   this population everywhere, not just mid-task. What's scoped OUT here:
   one-focal-element, no-list, the motion budget, no-spinner — those are
   about the moment of doing the work, which this page isn't.

   Purely presentational. App.jsx owns the actual sign-in call, the
   new-vs-returning profile check, and the welcome-message timing — because
   that same sequence has to run identically whether the student just
   clicked Sign in, or their session silently auto-restored on page load
   (Firebase's persisted session is what gives "remember this device"). If
   the welcome logic lived in here, the auto-restore path would never see
   it, since no click would ever happen. */
export default function LandingPage({ signedIn, welcome, onSignIn }) {
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setFailed(false);
    setWorking(true);
    try {
      await onSignIn();
      // App.jsx's onAuthStateChanged picks this up from here.
    } catch {
      // Popup closed, blocked, or a network failure. No error state shown
      // (hard rule 1 extends here too) — just let them try again.
      setWorking(false);
      setFailed(true);
    }
  }

  const showWelcome = signedIn && welcome;
  const showChecking = signedIn && !welcome;

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <section className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-6 pb-56 pt-16 text-center sm:pt-32">
        <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted sm:mb-4 sm:text-[0.72rem]">
          Adaptive task support
        </p>
        <h1 className="text-[1.9rem] font-bold leading-[1.15] sm:text-[2.6rem] md:text-[3.2rem]">
          One next step.
          <br />
          Never the whole list.
        </h1>
        <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.55] text-muted sm:mt-6 sm:text-[1.0625rem]">
          Paste an assignment. Get one small, physical thing to do right now.
          Say it's too big, and it gets smaller. No dashboard, no list, no
          pressure — just the next step.
        </p>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center px-6">
        <div
          className="breathing card-lit pointer-events-auto w-full max-w-sm px-6 py-5 text-center"
          aria-live="polite"
        >
          {showWelcome ? (
            <p className="text-[1.0625rem] font-bold">
              {welcome.isNew ? 'Welcome' : 'Welcome back'}
              {welcome.firstName ? `, ${welcome.firstName}` : ''}.
            </p>
          ) : showChecking ? (
            <p className="text-[1.0625rem] font-bold">Welcome back.</p>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </main>
  );
}
