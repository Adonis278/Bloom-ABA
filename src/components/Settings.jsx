export default function Settings({ settings, onChange, onClose }) {
  function update(patch) {
    onChange({ ...settings, ...patch })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-6 py-14">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="text-quiet text-sm font-chrome underline mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          back
        </button>

        <h1 className="text-ink font-display text-2xl mb-8">Settings</h1>

        <fieldset className="mb-6 bg-surface border border-hairline rounded-2xl px-5 py-4">
          <legend className="text-ink font-body text-base mb-3 px-1">How steps are made</legend>
          <label className="flex items-center gap-2 text-ink font-body text-sm mb-3">
            <input
              type="checkbox"
              checked={settings.aiRules.smallerSteps}
              onChange={(event) =>
                update({ aiRules: { ...settings.aiRules, smallerSteps: event.target.checked } })
              }
              className="focus-visible:ring-2 focus-visible:ring-accent"
            />
            Make steps smaller
          </label>
          <label className="flex items-center gap-2 text-ink font-body text-sm">
            <input
              type="checkbox"
              checked={settings.aiRules.readAloud}
              onChange={(event) =>
                update({ aiRules: { ...settings.aiRules, readAloud: event.target.checked } })
              }
              className="focus-visible:ring-2 focus-visible:ring-accent"
            />
            Read steps out loud
          </label>
        </fieldset>

        <fieldset className="mb-6 bg-surface border border-hairline rounded-2xl px-5 py-4">
          <legend className="text-ink font-body text-base mb-3 px-1">Text size</legend>
          <div className="flex gap-2">
            {['standard', 'large', 'largest'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => update({ textSize: size })}
                aria-pressed={settings.textSize === size}
                className={`px-3 py-2 rounded-full border font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  settings.textSize === size
                    ? 'border-ink text-ink bg-bg'
                    : 'border-hairline text-quiet'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="bg-surface border border-hairline rounded-2xl px-5 py-4">
          <legend className="text-ink font-body text-base mb-3 px-1">A little reminder for yourself</legend>
          <label className="flex items-center gap-2 text-ink font-body text-sm mb-3">
            <input
              type="checkbox"
              checked={settings.reward.enabled}
              onChange={(event) =>
                update({ reward: { ...settings.reward, enabled: event.target.checked } })
              }
              className="focus-visible:ring-2 focus-visible:ring-accent"
            />
            Show a message after a few steps
          </label>
          {settings.reward.enabled && (
            <input
              type="text"
              value={settings.reward.message}
              onChange={(event) =>
                update({ reward: { ...settings.reward, message: event.target.value } })
              }
              placeholder="e.g. You're doing this."
              className="w-full bg-bg border border-hairline rounded-xl px-3 py-2 text-ink font-body text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          )}
        </fieldset>
      </div>
    </div>
  )
}
