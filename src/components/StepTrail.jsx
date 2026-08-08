export default function ProgressBar({ percent }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-cloud/90 backdrop-blur shadow-md px-5 py-2">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="font-display font-bold text-xs text-ink">Progress</span>
          <span className="font-display font-bold text-xs text-purple">{percent}%</span>
        </div>
        <div className="h-2.5 w-full bg-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime via-sky to-purple rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
