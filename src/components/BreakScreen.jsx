export default function BreakScreen({ onReturn }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <p className="font-step text-ink text-2xl text-center max-w-md">
        You can take a short break whenever you want.
      </p>
      <p className="mt-3 text-quiet font-chrome text-sm text-center max-w-sm">
        Come back any time. Your step will be here.
      </p>
      <button
        type="button"
        onClick={onReturn}
        className="mt-8 bg-accent text-white font-chrome text-base px-8 py-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
      >
        back to my step
      </button>
    </div>
  )
}
