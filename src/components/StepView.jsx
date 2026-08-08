import { useEffect } from 'react'
import ProgressBar from './StepTrail.jsx'

const TEXT_SIZE_CLASS = {
  standard: 'text-3xl',
  large: 'text-4xl',
  largest: 'text-5xl',
}

export default function StepView({
  stepId,
  stepText,
  percent,
  badges,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-16 pt-24">
      <ProgressBar percent={percent} />

      {badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6" aria-label="Badges earned">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="flex items-center gap-1 bg-cloud shadow-md rounded-full px-3 py-1.5 text-xs font-display font-bold text-ink motion-safe:animate-popIn"
            >
              <span aria-hidden="true">{badge.emoji}</span>
              {badge.label}
            </span>
          ))}
        </div>
      )}

      <div
        key={stepId}
        className="motion-safe:animate-popIn bg-cloud rounded-[2.5rem] border-4 border-sky/30 shadow-2xl px-8 py-10 max-w-lg w-full text-center"
      >
        <p className={`font-display font-bold text-ink leading-snug ${sizeClass}`}>{stepText}</p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-8 min-h-[56px] bg-gradient-to-r from-lime via-sky to-purple text-white font-display font-bold text-lg px-10 rounded-full shadow-lg motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-purple"
      >
        Done! ✅
      </button>

      <div className="mt-5 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onRejectOpen}
          className="text-ink/60 text-sm font-body font-semibold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded"
        >
          this isn&apos;t right 🤔
        </button>

        {suggestBreak && (
          <button
            type="button"
            onClick={onBreakOpen}
            className="text-ink/60 text-sm font-body font-semibold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded"
          >
            need a breather? 😌
          </button>
        )}
      </div>
    </div>
  )
}
