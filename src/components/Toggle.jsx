export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-ink font-body font-semibold text-sm">{label}</span>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="w-12 h-7 rounded-full bg-ink/15 peer-checked:bg-gradient-to-r peer-checked:from-lime peer-checked:to-sky motion-safe:transition-colors motion-safe:duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-purple peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden="true"
          className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow motion-safe:transition-transform motion-safe:duration-200 peer-checked:translate-x-5"
        />
      </span>
    </label>
  )
}
