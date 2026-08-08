import { useEffect, useState } from 'react';
import {
  loadDisplayPrefs,
  saveDisplayPrefs,
  applyDisplayPrefs,
  SCALE_OPTIONS,
  TINT_OPTIONS,
} from '../lib/accessibility.js';

function OptionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tap rounded-lg border px-4 text-[0.9375rem] ${
        active ? 'border-ink font-bold' : 'border-line'
      }`}
    >
      {children}
    </button>
  );
}

/* spec.md F26 / DESIGN.md section 10: student-controlled text size,
   spacing, weight, and tint. Reached only from Entry's small "Display"
   link — same scoped exception to hard rule 3 as "My work" and
   "Progress". Never reachable from Step, so the in-task screen keeps its
   one-focal-element purity untouched.

   Every control here applies immediately (no separate Save step — a
   confirm/cancel pair would itself be a decision, which is exactly what
   this product avoids for the step loop, and there's no reason to make an
   exception for a display preference). */
export default function Display({ onBack }) {
  const [prefs, setPrefs] = useState(loadDisplayPrefs);

  useEffect(() => {
    applyDisplayPrefs(prefs);
    saveDisplayPrefs(prefs);
  }, [prefs]);

  function update(patch) {
    setPrefs((p) => ({ ...p, ...patch }));
  }

  return (
    <main className="min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-[620px]">
        <div className="mb-8">
          <button type="button" onClick={onBack} className="tap rounded-lg px-3 text-[0.9375rem] text-muted">
            Back
          </button>
        </div>

        <h1 className="mb-8 text-step font-bold">Display</h1>

        <section className="card-lit mb-6 px-6 py-6">
          <p className="mb-3 text-[0.9375rem] font-bold text-ink">Text size</p>
          <div className="flex flex-wrap gap-3">
            {SCALE_OPTIONS.map((s) => (
              <OptionButton key={s} active={prefs.scale === s} onClick={() => update({ scale: s })}>
                {s}%
              </OptionButton>
            ))}
          </div>
        </section>

        <section className="card-lit mb-6 px-6 py-6">
          <p className="mb-3 text-[0.9375rem] font-bold text-ink">Spacing</p>
          <div className="flex flex-wrap gap-3">
            <OptionButton active={prefs.spacing === 'default'} onClick={() => update({ spacing: 'default' })}>
              Default
            </OptionButton>
            <OptionButton active={prefs.spacing === 'wide'} onClick={() => update({ spacing: 'wide' })}>
              Wide
            </OptionButton>
          </div>
        </section>

        <section className="card-lit mb-6 px-6 py-6">
          <p className="mb-3 text-[0.9375rem] font-bold text-ink">Weight</p>
          <div className="flex flex-wrap gap-3">
            <OptionButton active={prefs.weight === 'default'} onClick={() => update({ weight: 'default' })}>
              Default
            </OptionButton>
            <OptionButton active={prefs.weight === 'bold'} onClick={() => update({ weight: 'bold' })}>
              Bold
            </OptionButton>
          </div>
        </section>

        <section className="card-lit px-6 py-6">
          <p className="mb-3 text-[0.9375rem] font-bold text-ink">Tint</p>
          <div className="flex flex-wrap gap-3">
            {TINT_OPTIONS.map((t) => (
              <OptionButton key={t.label} active={prefs.tint === t.value} onClick={() => update({ tint: t.value })}>
                {t.label}
              </OptionButton>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
