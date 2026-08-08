import Toggle from './Toggle.jsx'

export default function Settings({ settings, onChange, onClose }) {
  function update(patch) {
    onChange({ ...settings, ...patch })
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

        <h1 className="text-ink font-display font-extrabold text-3xl mb-8">Settings ⚙️</h1>

        <fieldset className="mb-5 bg-cloud shadow-xl border-2 border-sky/20 rounded-3xl px-5 py-5">
          <legend className="text-ink font-display font-bold text-base mb-3 px-1">
            How steps are made
          </legend>
          <div className="flex flex-col gap-4">
            <Toggle
              label="Make steps smaller"
              checked={settings.aiRules.smallerSteps}
              onChange={(event) =>
                update({ aiRules: { ...settings.aiRules, smallerSteps: event.target.checked } })
              }
            />
            <Toggle
              label="Read steps out loud"
              checked={settings.aiRules.readAloud}
              onChange={(event) =>
                update({ aiRules: { ...settings.aiRules, readAloud: event.target.checked } })
              }
            />
          </div>
        </fieldset>

        <fieldset className="mb-5 bg-cloud shadow-xl border-2 border-yellow/30 rounded-3xl px-5 py-5">
          <legend className="text-ink font-display font-bold text-base mb-3 px-1">Text size</legend>
          <div className="flex gap-2">
            {['standard', 'large', 'largest'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => update({ textSize: size })}
                aria-pressed={settings.textSize === size}
                className={`px-4 py-2 rounded-full font-display font-bold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple motion-safe:transition-transform motion-safe:hover:scale-105 ${
                  settings.textSize === size
                    ? 'bg-gradient-to-r from-purple to-pink text-white shadow-md'
                    : 'bg-ink/5 text-ink/70'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="bg-cloud shadow-xl border-2 border-lime/40 rounded-3xl px-5 py-5">
          <legend className="text-ink font-display font-bold text-base mb-3 px-1">
            A little reminder for yourself 🎉
          </legend>
          <Toggle
            label="Show a message after a few steps"
            checked={settings.reward.enabled}
            onChange={(event) =>
              update({ reward: { ...settings.reward, enabled: event.target.checked } })
            }
          />
          {settings.reward.enabled && (
            <input
              type="text"
              value={settings.reward.message}
              onChange={(event) =>
                update({ reward: { ...settings.reward, message: event.target.value } })
              }
              placeholder="e.g. You're doing this! 🌟"
              className="mt-3 w-full bg-ink/5 border-2 border-ink/10 rounded-xl px-3 py-2 text-ink font-body text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple"
            />
          )}
        </fieldset>
      </div>
    </div>
  )
}
