import { callNvidia } from './nvidia.js';
import { callAnthropic } from './anthropic.js';

/* ---------------------------------------------------------------------------
   Provider chain with failsafe.

   Tries each tier in order and returns the first usable text. A tier is
   skipped when its key is absent, and moved past on any failure: timeout,
   non-2xx, model not provisioned, or an empty completion.

   Order is not a guess. Measured against this account on 2026-08-06 with a
   real first-step prompt:

     meta/llama-3.1-70b-instruct   2.1s   19 words, verb-first, preparatory,
                                          used the assignment context
     meta/llama-3.1-8b-instruct    0.9s   7 words, valid, less contextual
     claude-sonnet-4-6              n/a    spec'd model, needs a key

   Rejected during that benchmark, do not add back without re-measuring:
     meta/llama-3.3-70b-instruct         >20s, timed out twice
     nvidia/llama-3.1-nemotron-70b       404, not provisioned on this account
     nv-mistralai/mistral-nemo-12b       404, not provisioned on this account
     nvidia/llama-3.3-nemotron-super-49b 5.7s, empty content (reasoning model)
     openai/gpt-oss-20b                  timed out (reasoning model)

   Timeouts tighten down the chain. The point of a fallback is to beat the
   10-second budget, so a slow tier is a failed tier.

   Measured over 8 sequential trials: tier 1 served 7/8 at 0.7-2.0s. The one
   miss aborted on timeout and cost the full timeout before tier 2 ran, so the
   tier-1 timeout is the single biggest lever on worst-case latency. At the
   original 8000ms a fallthrough totalled ~9.3s — inside the 10s budget by
   0.7s, which is not a margin. 4000ms is still double the worst observed
   tier-1 response and caps a fallthrough at ~5.3s.
--------------------------------------------------------------------------- */

export const CHAIN = [
  { provider: 'nvidia',    model: 'meta/llama-3.1-70b-instruct', timeoutMs: 4000 },
  { provider: 'nvidia',    model: 'meta/llama-3.1-8b-instruct',  timeoutMs: 4000 },
  { provider: 'anthropic', model: 'claude-sonnet-4-6',           timeoutMs: 5000 },
];

export async function generate({
  system,
  user,
  maxTokens = 120,
  temperature = 0.3,
  keys = {},
}) {
  const attempts = [];

  for (const tier of CHAIN) {
    const apiKey = tier.provider === 'nvidia' ? keys.nvidia : keys.anthropic;
    if (!apiKey) {
      attempts.push({ model: tier.model, skipped: 'no key' });
      continue;
    }

    const startedAt = Date.now();
    try {
      const text =
        tier.provider === 'nvidia'
          ? await callNvidia({ apiKey, ...tier, system, user, maxTokens, temperature })
          : await callAnthropic({ apiKey, ...tier, system, user, maxTokens });

      return { text, model: tier.model, ms: Date.now() - startedAt, attempts };
    } catch (err) {
      attempts.push({
        model: tier.model,
        ms: Date.now() - startedAt,
        error: String(err?.message ?? err).slice(0, 200),
      });
    }
  }

  /* Every tier failed. The caller decides what a student sees — and per hard
     rule 1, what they see is never an error state. */
  const exhausted = new Error('all providers failed');
  exhausted.attempts = attempts;
  throw exhausted;
}
