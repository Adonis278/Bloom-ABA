import { useEffect } from 'react'
import StepTrail from './StepTrail.jsx'

const TEXT_SIZE_CLASS = {
  standard: 'text-3xl',
  large: 'text-4xl',
  largest: 'text-5xl',
}

export default function StepView({
  stepText,
  pastCount,
  suggestBreak,
  textSize,
  readAloud,
  onDone,
  onRejectOpen,
  onBreakOpen,
}) {
  useEffect(() => {
    if (!readAloud || !stepText) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(stepText)
    window.speechSynthesis.speak(utterance)
    return () => window.speechSynthesis.cancel()
  }, [stepText, readAloud])

  const sizeClass = TEXT_SIZE_CLASS[textSize] ?? TEXT_SIZE_CLASS.standard

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 pb-20">
      <p className={`font-step text-ink text-center max-w-lg ${sizeClass}`}>{stepText}</p>

      <button
        type="button"
        onClick={onDone}
        className="mt-10 bg-accent text-white font-chrome text-base px-8 py-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
      >
        Done
      </button>

      <div className="mt-4 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onRejectOpen}
          className="text-quiet text-sm font-chrome underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          this isn&apos;t right
        </button>

        {suggestBreak && (
          <button
            type="button"
            onClick={onBreakOpen}
            className="text-quiet text-sm font-chrome underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            want a short break?
          </button>
        )}
      </div>

      <StepTrail pastCount={pastCount} />
    </div>
  )
}
