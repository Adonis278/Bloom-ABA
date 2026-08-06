export default function StepTrail({ pastCount }) {
  const position = pastCount + 1

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pointer-events-none">
      <div className="flex items-center gap-2" aria-hidden="true">
        {Array.from({ length: pastCount }).map((_, index) => (
          <span key={index} className="w-2 h-2 rounded-full bg-trail" />
        ))}
        <span className="w-2 h-2 rounded-full border border-ink" />
      </div>
      <span className="sr-only">You&apos;re on step {position} of your task.</span>
    </div>
  )
}
