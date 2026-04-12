import type { ProductAttribute } from '../types/product';

const EXTRACTION_PROMPT = `You are a product data extractor for Amazon. Extract meaningful product attributes from the page text below.

Rules:
- Include factual specs only (dimensions, weight, material, compatibility, battery, resolution, etc.)
- Skip pure marketing phrases ("premium quality", "best in class", "revolutionary")
- Normalize units: "250 grams" → value: "250", unit: "g"
- Use readable labels: "Battery Life", "Screen Size", "Weight", etc.
- Use snake_case for keys: "battery_life", "screen_size", "weight"
- Max 20 most important attributes
- If a value has no unit, omit the unit field

Respond ONLY with a valid JSON array. No explanation, no markdown. Example:
[{"key":"battery_life","label":"Battery Life","value":"30","unit":"hours","rawValue":"Up to 30 hours"},{"key":"weight","label":"Weight","value":"250","unit":"g","rawValue":"250 grams"}]

Page text:
`;

interface RawAttribute {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  rawValue: string;
}

export async function extractAttributesWithLLM(
  pageText: string,
  apiKey: string
): Promise<ProductAttribute[]> {
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
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT + pageText.slice(0, 4000), // cap to control cost
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error: ${response.status} — ${errBody}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '[]';

  // Parse JSON — handle LLM occasionally wrapping in markdown
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed: RawAttribute[] = JSON.parse(jsonMatch[0]);
  return parsed.map((attr) => ({
    key: String(attr.key),
    label: String(attr.label),
    value: attr.value,
    rawValue: String(attr.rawValue),
    unit: attr.unit,
  }));
}
