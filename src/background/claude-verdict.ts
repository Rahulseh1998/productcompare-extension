import type { Product } from '../types/product';
import type { VerdictResult } from '../types/comparison';

function buildVerdictPrompt(products: Product[]): string {
  const productLines = products.map((p) => {
    const topAttrs = p.attributes
      .slice(0, 5)
      .map((a) => `${a.label}: ${a.value}${a.unit ? ' ' + a.unit : ''}`)
      .join(', ');

    return `ASIN: ${p.asin}
Title: ${p.title}
Price: ${p.priceFormatted}
Rating: ${p.rating ?? 'N/A'}/5 (${p.reviewCount ?? 'N/A'} reviews)
Brand: ${p.brand ?? 'N/A'}
Key specs: ${topAttrs || 'N/A'}`;
  }).join('\n\n');

  return `You are a helpful shopping assistant. Compare these Amazon products and give a concise, honest verdict.

${productLines}

Respond ONLY with this exact JSON (no markdown, no explanation):
{
  "bestValue": "<ASIN of best value for money>",
  "bestSpecs": "<ASIN with best technical specifications>",
  "bestRated": "<ASIN with highest customer satisfaction>",
  "summary": "<2-3 sentences a real shopper would find useful. Be specific, mention actual product names and key differentiators.>"
}`;
}

export async function generateVerdict(
  products: Product[],
  apiKey: string
): Promise<VerdictResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: buildVerdictPrompt(products) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '{}';

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid verdict response from LLM');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    bestValue: parsed.bestValue ?? products[0].asin,
    bestSpecs: parsed.bestSpecs ?? products[0].asin,
    bestRated: parsed.bestRated ?? products[0].asin,
    summary: parsed.summary ?? '',
    generatedAt: Date.now(),
  };
}
