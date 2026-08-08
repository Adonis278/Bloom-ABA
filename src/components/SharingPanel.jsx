import Toggle from './Toggle.jsx'

export default function SharingPanel({ sharing, onChange, onClose }) {
  function setShareNothing() {
    onChange({
      ...sharing,
      shareCurrentStep: false,
      shareStuckFrequency: false,
      shareNothing: true,
    })
  }

  function toggleOption(key) {
    onChange({
      ...sharing,
      [key]: !sharing[key],
      shareNothing: false,
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="bg-cloud shadow-md rounded-full px-4 py-2 text-ink font-display font-semibold text-sm mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple"
        >
          ← back
        </button>

        <h1 className="text-ink font-display font-extrabold text-3xl mb-2">Sharing 🔗</h1>
        <p className="text-ink/70 text-sm font-body mb-8">
          You choose what an adult can see. You can change this any time.
        </p>

        <div className="flex flex-col gap-3">
          <div className="bg-cloud shadow-xl border-2 border-sky/20 rounded-2xl px-4 py-4">
            <Toggle
              label="Share my current step"
              checked={sharing.shareCurrentStep}
              onChange={() => toggleOption('shareCurrentStep')}
            />
          </div>

          <div className="bg-cloud shadow-xl border-2 border-orange/20 rounded-2xl px-4 py-4">
            <Toggle
              label="Share how often I get stuck"
              checked={sharing.shareStuckFrequency}
              onChange={() => toggleOption('shareStuckFrequency')}
            />
          </div>

          <div className="bg-cloud shadow-xl border-2 border-lime/30 rounded-2xl px-4 py-4">
            <Toggle
              label="Share nothing"
              checked={sharing.shareNothing}
              onChange={setShareNothing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
