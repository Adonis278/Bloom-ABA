export default function BreakScreen({ onReturn }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <p className="font-display text-ink text-2xl text-center max-w-md leading-[1.3]">
        You can take a short break whenever you want.
      </p>
      <p className="mt-3 text-quiet font-body text-sm text-center max-w-sm">
        Come back any time. Your step will be here.
      </p>
      <button
        type="button"
        onClick={onReturn}
        className="mt-8 min-h-[52px] bg-accent text-white font-chrome text-base px-8 rounded-[22px_28px_20px_26px] motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
      >
        back to my step
      </button>
    </div>
  )
}
