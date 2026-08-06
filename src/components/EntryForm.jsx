import { useState } from 'react'

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7l1.6-2.4A1.5 1.5 0 0 1 10.8 4h2.4a1.5 1.5 0 0 1 1.2.6L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
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
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <label htmlFor="assignment-input" className="block text-ink font-display text-2xl mb-5">
          What do you need to do?
        </label>
        <div className="flex items-center gap-2 bg-surface border border-hairline rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
          <input
            id="assignment-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste or type your assignment"
            className="flex-1 bg-transparent outline-none text-ink font-body text-base py-1"
            autoFocus
          />
          <span className="text-quiet" title="Voice input (coming soon)">
            <MicIcon />
          </span>
          <span className="text-quiet" title="Photo input (coming soon)">
            <CameraIcon />
          </span>
        </div>

        <button
          type="submit"
          className="mt-5 w-full min-h-[52px] bg-accent text-white font-chrome text-base px-8 rounded-[22px_28px_20px_26px] motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
        >
          Get my first step
        </button>
      </form>

      <div className="w-full max-w-md mt-8 text-sm text-quiet font-body">
        <p>
          We only use what you type to make your steps. Nothing is shared without you saying so.{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyDetail((prev) => !prev)}
            className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
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
