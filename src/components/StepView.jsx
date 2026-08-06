import { useEffect } from 'react'
import StepTrail from './StepTrail.jsx'

const TEXT_SIZE_CLASS = {
  standard: 'text-[clamp(1.75rem,4vw+1rem,3rem)]',
  large: 'text-[clamp(2rem,4.5vw+1.25rem,3.5rem)]',
  largest: 'text-[clamp(2.25rem,5vw+1.5rem,4rem)]',
}

export default function StepView({
  stepId,
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
      <p
        key={stepId}
        className={`step-fade-enter font-display text-ink text-center max-w-lg leading-[1.3] tracking-tight ${sizeClass}`}
      >
        {stepText}
      </p>

      <button
        type="button"
        onClick={onDone}
        className="mt-10 min-h-[52px] bg-accent text-white font-chrome text-base px-8 rounded-[22px_28px_20px_26px] motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
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
