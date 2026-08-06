/* NVIDIA NIM — OpenAI-compatible chat completions.
   https://integrate.api.nvidia.com/v1/chat/completions

   Node 22 has global fetch, so there is no SDK dependency here. */

const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function callNvidia({ apiKey, model, system, user, maxTokens, temperature, timeoutMs }) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: abort.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`nvidia ${model} HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const message = data?.choices?.[0]?.message;
    const text = (message?.content ?? '').trim();

    /* Reasoning models on this endpoint return their output in
       reasoning_content and leave content empty. Verified: nemotron-super-49b
       and gpt-oss-20b both do this. An empty string is not a usable step, so
       treat it as a failure and let the chain fall through to the next model
       rather than returning nothing to a student. */
    if (!text) {
      throw new Error(`nvidia ${model}: empty content (reasoning-style response)`);
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}
