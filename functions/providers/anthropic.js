import Anthropic from '@anthropic-ai/sdk';

/* Anthropic — the model DESIGN.md section 4 specifies. Last tier in the
   chain, and only reachable if ANTHROPIC_API_KEY is set. */

export async function callAnthropic({ apiKey, model, system, user, maxTokens, timeoutMs }) {
  const client = new Anthropic({ apiKey, timeout: timeoutMs, maxRetries: 0 });

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],

    /* Sonnet 4.6 defaults to effort "high", which would blow the sub-3s
       latency target in DESIGN.md section 4. A step is one sentence of 25
       words or fewer with a hard format contract — there is nothing here that
       benefits from deliberation, so thinking is off and effort is low. */
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  if (!text) throw new Error(`anthropic ${model}: empty response`);
  return text;
}
