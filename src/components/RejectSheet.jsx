import { useEffect, useRef } from 'react'

const REASONS = [
  { key: 'too_big', label: 'too big' },
  { key: 'too_vague', label: 'too vague' },
  { key: 'missing_materials', label: "I don't have what I need" },
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
    <div className="fixed inset-0 bg-ink/20 flex items-end justify-center z-10">
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
        className="relative bg-bg w-full max-w-md rounded-t-xl px-6 py-6 flex flex-col gap-3"
      >
        {REASONS.map((reason) => (
          <button
            key={reason.key}
            type="button"
            onClick={() => onChoose(reason.key)}
            className="w-full text-left border border-ink/20 rounded-md px-4 py-3 text-ink font-chrome text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {reason.label}
          </button>
        ))}
      </div>
    </div>
  )
}
