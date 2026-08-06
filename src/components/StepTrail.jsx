export default function StepTrail({ pastCount }) {
  const position = pastCount + 1
  const dotCount = pastCount + 1

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-7 pointer-events-none">
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: dotCount }).map((_, index) => {
          const isCurrent = index === dotCount - 1
          return (
            <span key={index} className="flex items-center">
              <span
                className={
                  isCurrent
                    ? 'w-2.5 h-2.5 rounded-full border border-ink'
                    : 'w-2.5 h-2.5 rounded-full bg-trail'
                }
              />
              {!isCurrent && <span className="w-4 h-px bg-hairline" />}
            </span>
          )
        })}
      </div>
      <span className="sr-only">You&apos;re on step {position} of your task.</span>
    </div>
  )
}
