export default function BreakScreen({ onReturn }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <span className="text-7xl motion-safe:animate-wiggle inline-block" aria-hidden="true">
        🧘
      </span>
      <p className="font-display font-extrabold text-ink text-3xl mt-4 max-w-md">
        Break time! You&apos;ve earned it.
      </p>
      <p className="mt-3 text-ink/60 font-body text-base max-w-sm">
        Stretch, breathe, grab a snack. Come back whenever you&apos;re ready — your step will be
        right here. 💛
      </p>
      <button
        type="button"
        onClick={onReturn}
        className="mt-8 min-h-[56px] bg-gradient-to-r from-purple via-pink to-orange text-white font-display font-bold text-lg px-10 rounded-full shadow-lg motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-purple"
      >
        Back to my step 🚀
      </button>
    </div>
  )
}
