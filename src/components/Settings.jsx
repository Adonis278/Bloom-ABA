export default function Settings({ settings, onChange, onClose }) {
  function update(patch) {
    onChange({ ...settings, ...patch })
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

        <h1 className="text-ink text-xl font-chrome mb-6">Settings</h1>

        <fieldset className="mb-6">
          <legend className="text-ink font-chrome text-base mb-2">How steps are made</legend>
          <label className="flex items-center gap-2 text-ink font-chrome text-sm mb-2">
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
          <label className="flex items-center gap-2 text-ink font-chrome text-sm">
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

        <fieldset className="mb-6">
          <legend className="text-ink font-chrome text-base mb-2">Text size</legend>
          <div className="flex gap-2">
            {['standard', 'large', 'largest'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => update({ textSize: size })}
                aria-pressed={settings.textSize === size}
                className={`px-3 py-2 rounded-md border font-chrome text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  settings.textSize === size
                    ? 'border-ink text-ink'
                    : 'border-ink/20 text-quiet'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-ink font-chrome text-base mb-2">A little reminder for yourself</legend>
          <label className="flex items-center gap-2 text-ink font-chrome text-sm mb-2">
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
              className="w-full border border-ink/20 rounded-md px-3 py-2 text-ink font-chrome text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          )}
        </fieldset>
      </div>
    </div>
  )
}
