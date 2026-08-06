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
    <div className="min-h-screen bg-bg flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="text-quiet text-sm font-chrome underline mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          back
        </button>

        <h1 className="text-ink text-xl font-chrome mb-2">Sharing</h1>
        <p className="text-quiet text-sm font-chrome mb-6">
          You choose what an adult can see. You can change this any time.
        </p>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 border border-ink/20 rounded-md px-4 py-3">
            <input
              type="checkbox"
              checked={sharing.shareCurrentStep}
              onChange={() => toggleOption('shareCurrentStep')}
              className="focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="text-ink font-chrome text-sm">Share my current step</span>
          </label>

          <label className="flex items-center gap-3 border border-ink/20 rounded-md px-4 py-3">
            <input
              type="checkbox"
              checked={sharing.shareStuckFrequency}
              onChange={() => toggleOption('shareStuckFrequency')}
              className="focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="text-ink font-chrome text-sm">Share how often I get stuck</span>
          </label>

          <label className="flex items-center gap-3 border border-ink/20 rounded-md px-4 py-3">
            <input
              type="checkbox"
              checked={sharing.shareNothing}
              onChange={setShareNothing}
              className="focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="text-ink font-chrome text-sm">Share nothing</span>
          </label>
        </div>
      </div>
    </div>
  )
}
