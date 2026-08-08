import { useState } from 'react'

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 7l1.6-2.4A1.5 1.5 0 0 1 10.8 4h2.4a1.5 1.5 0 0 1 1.2.6L16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function EntryForm({ onSubmit }) {
  const [value, setValue] = useState('')
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-10 w-64 h-64 rounded-full bg-purple/30 blur-2xl motion-safe:animate-blob1"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-pink/30 blur-2xl motion-safe:animate-blob2"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/4 w-56 h-56 rounded-full bg-yellow/40 blur-2xl motion-safe:animate-blob3"
      />

      <div className="relative w-full max-w-md text-center mb-2">
        <span className="text-5xl" aria-hidden="true">
          🚀
        </span>
        <h1 className="font-display font-extrabold text-ink text-4xl mt-2 mb-1">
          Let&apos;s smash this task!
        </h1>
        <p className="font-body text-ink/70 text-base">Type it in and let&apos;s go 💪</p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-md mt-6">
        <label htmlFor="assignment-input" className="sr-only">
          What do you need to do?
        </label>
        <div className="flex items-center gap-2 bg-cloud border-4 border-purple/20 rounded-3xl px-4 py-3 shadow-xl focus-within:border-purple">
          <input
            id="assignment-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste or type your assignment ✏️"
            className="flex-1 bg-transparent outline-none text-ink font-body font-medium text-base py-1"
            autoFocus
          />
          <span className="text-purple" title="Voice input (coming soon)">
            <MicIcon />
          </span>
          <span className="text-pink" title="Photo input (coming soon)">
            <CameraIcon />
          </span>
        </div>

        <button
          type="submit"
          className="mt-5 w-full min-h-[56px] bg-gradient-to-r from-purple via-pink to-orange text-white font-display font-bold text-lg rounded-full shadow-lg motion-safe:animate-pulseGlow motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-purple"
        >
          Get my first step 🎯
        </button>
      </form>

      <div className="relative w-full max-w-md mt-8 text-sm text-ink/70 font-body text-center">
        <p>
          We only use what you type to make your steps. Nothing is shared without you saying so.{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyDetail((prev) => !prev)}
            className="underline font-semibold text-purpleText focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded"
          >
            {showPrivacyDetail ? 'less' : 'more'}
          </button>
        </p>
        {showPrivacyDetail && (
          <p className="mt-2">
            Your assignment text stays on this device unless you choose to share your progress
            with someone in Sharing settings. There is no account and no sign up.
          </p>
        )}
      </div>
    </div>
  )
}
