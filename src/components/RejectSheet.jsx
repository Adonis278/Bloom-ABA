import { useEffect, useRef } from 'react'

const REASONS = [
  { key: 'too_big', label: 'Too big', emoji: '🐘' },
  { key: 'too_vague', label: 'Too vague', emoji: '🌫️' },
  { key: 'missing_materials', label: "I don't have what I need", emoji: '🎒' },
]

export default function RejectSheet({ onChoose, onClose }) {
  const sheetRef = useRef(null)

  useEffect(() => {
    sheetRef.current?.querySelector('button')?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end justify-center z-40">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="What's wrong with this step?"
        className="relative motion-safe:animate-bounceIn bg-cloud w-full max-w-md rounded-t-[2.5rem] px-6 py-8 flex flex-col gap-3 shadow-2xl border-t-4 border-pink"
      >
        <p className="font-display font-bold text-ink text-lg text-center mb-2">
          What&apos;s up? 🤔
        </p>
        {REASONS.map((reason) => (
          <button
            key={reason.key}
            type="button"
            onClick={() => onChoose(reason.key)}
            className="w-full flex items-center gap-3 text-left bg-gradient-to-r from-sky/10 to-purple/10 border-2 border-purple/20 rounded-2xl px-4 py-3 text-ink font-body font-semibold text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-purple motion-safe:transition-transform motion-safe:hover:scale-[1.02]"
          >
            <span className="text-2xl" aria-hidden="true">
              {reason.emoji}
            </span>
            {reason.label}
          </button>
        ))}
      </div>
    </div>
  )
}
