/**
 * Chrome Built-in AI (Gemini Nano) — runs locally on-device.
 * Zero setup, zero cost, zero latency, zero privacy concern.
 *
 * API: `LanguageModel` global (Chrome 138+).
 *
 * Gemini Nano (~1.7B params) often ignores "output JSON only" instructions
 * and returns markdown. We handle this with:
 * 1. Completion-style prompts (model continues the pattern)
 * 2. Markdown fallback parsers when JSON fails
 */

import type { ProductAttribute } from '../types/product';
import type { VerdictResult } from '../types/comparison';
import type { Product } from '../types/product';

// TypeScript declarations for Chrome 138+ LanguageModel API
declare global {
  interface LanguageModelInstance {
    prompt(input: string): Promise<string>;
    destroy(): void;
  }
  interface LanguageModelParams {
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }
  // eslint-disable-next-line no-var
  var LanguageModel: {
    availability(): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
    params(): Promise<LanguageModelParams>;
    create(options?: {
      systemPrompt?: string;
      topK?: number;
      temperature?: number;
    }): Promise<LanguageModelInstance>;
  } | undefined;
}

// ── Availability ────────────────────────────────────────────────────────────

export type LocalAIStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export async function getLocalAIStatus(): Promise<LocalAIStatus> {
  try {
    if (typeof LanguageModel === 'undefined') return 'unavailable';
    return await LanguageModel.availability();
  } catch {
    return 'unavailable';
  }
}

export function isLocalAIUsable(status: LocalAIStatus): boolean {
  return status === 'available' || status === 'downloadable';
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toSnakeCase(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Cache sessions to avoid expensive re-creation (model load takes 2-5s)
let cachedExtractSession: LanguageModelInstance | null = null;
let cachedVerdictSession: LanguageModelInstance | null = null;

async function getExtractSession(): Promise<LanguageModelInstance> {
  if (cachedExtractSession) return cachedExtractSession;
  const params = await LanguageModel!.params();
  cachedExtractSession = await LanguageModel!.create({
    systemPrompt: 'List product specs as "Label: Value", one per line. Only facts.',
    topK: params.defaultTopK,
    temperature: params.defaultTemperature,
  });
  return cachedExtractSession;
}

async function getVerdictSession(): Promise<LanguageModelInstance> {
  if (cachedVerdictSession) return cachedVerdictSession;
  const params = await LanguageModel!.params();
  cachedVerdictSession = await LanguageModel!.create({
    systemPrompt: 'You are a concise shopping advisor. Be brief.',
    topK: params.defaultTopK,
    temperature: params.defaultTemperature,
  });
  return cachedVerdictSession;
}

// ── Extraction ──────────────────────────────────────────────────────────────

export async function extractWithLocalAI(pageText: string): Promise<ProductAttribute[]> {
  const session = await getExtractSession();

  // Short prompt — less tokens = faster inference
  const result = await session.prompt(
    `Specs from this product page (Label: Value format):\n${pageText.slice(0, 2000)}`
  );
  console.log('[CC] Local AI raw extraction:', result.slice(0, 300));

  // Try JSON first (occasionally works)
  const jsonAttrs = tryParseJSON(result);
  if (jsonAttrs.length > 0) return jsonAttrs;

  // Parse markdown/text format (the usual output)
  return parseMarkdownAttributes(result);
}

function tryParseJSON(text: string): ProductAttribute[] {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return parsed.map((a: Record<string, unknown>) => ({
      key: toSnakeCase(String(a.key ?? a.label ?? '')),
      label: String(a.label ?? a.key ?? ''),
      value: a.value ?? null,
      rawValue: String(a.rawValue ?? a.value ?? ''),
      unit: a.unit ? String(a.unit) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Parse markdown-formatted attributes from Gemini Nano output.
 * Handles: **Label:** Value, * **Label:** Value, Label: Value, - Label: Value
 */
function parseMarkdownAttributes(text: string): ProductAttribute[] {
  const attrs: ProductAttribute[] = [];
  const seen = new Set<string>();

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|')) continue;

    // Match patterns: "**Label:** Value", "* **Label:** Value", "- Label: Value", "Label: Value"
    const match = trimmed.match(
      /^[\s*\-]*\*?\*?\s*\*?\*?([^*:\n]+?)\*?\*?\s*[:]\s*\*?\*?\s*(.+?)$/
    );
    if (!match) continue;

    const label = match[1].replace(/\*\*/g, '').trim();
    const value = match[2].replace(/\*\*/g, '').trim();

    if (!label || !value || label.length > 50 || value.length > 200) continue;
    // Skip headers/noise
    if (/^(here|note|text|summary|product|attribute|spec)/i.test(label)) continue;

    const key = toSnakeCase(label);
    if (seen.has(key)) continue;
    seen.add(key);

    attrs.push({ key, label, value, rawValue: value });
  }

  return attrs;
}

// ── Verdict ─────────────────────────────────────────────────────────────────

export async function generateVerdictWithLocalAI(products: Product[]): Promise<VerdictResult> {
  const productLines = products.map((p) =>
    `${p.asin}: ${p.title.slice(0, 40)} — ${p.priceFormatted}, ${p.rating ?? '?'}/5`
  ).join('\n');

  const session = await getVerdictSession();

  const result = await session.prompt(
    `Which product wins? Answer: Best value (ASIN), Best specs (ASIN), Best rated (ASIN), 2-sentence summary.\n\n${productLines}`
  );
  console.log('[CC] Local AI raw verdict:', result.slice(0, 300));

  // Try JSON first
  const jsonVerdict = tryParseVerdictJSON(result, products);
  if (jsonVerdict) return jsonVerdict;

  // Parse text format
  return parseTextVerdict(result, products);
}

function tryParseVerdictJSON(text: string, products: Product[]): VerdictResult | null {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!parsed.bestValue && !parsed.summary) return null;
    return {
      bestValue: parsed.bestValue ?? products[0].asin,
      bestSpecs: parsed.bestSpecs ?? products[0].asin,
      bestRated: parsed.bestRated ?? products[0].asin,
      summary: parsed.summary ?? '',
      generatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Parse text-formatted verdict from Gemini Nano.
 * Looks for ASIN patterns near "best value", "best specs", "best rated" keywords.
 */
function parseTextVerdict(text: string, products: Product[]): VerdictResult {
  const asins = products.map((p) => p.asin);
  const lower = text.toLowerCase();

  const findAsinNear = (keyword: string): string => {
    const idx = lower.indexOf(keyword);
    if (idx === -1) return products[0].asin;
    // Search for an ASIN within 200 chars after the keyword
    const slice = text.slice(idx, idx + 200);
    for (const asin of asins) {
      if (slice.includes(asin)) return asin;
    }
    return products[0].asin;
  };

  // Extract summary — find the longest sentence that contains a product name
  const sentences = text.split(/[.!]\s+/).filter((s) => s.length > 30);
  const summaryParts = sentences
    .filter((s) => asins.some((a) => s.includes(a)) || /best|recommend|value|winner|overall/i.test(s))
    .slice(0, 2);
  const summary = summaryParts.join('. ').trim() || 'Compare the products above to find the best option for your needs.';

  return {
    bestValue: findAsinNear('best value') || findAsinNear('value'),
    bestSpecs: findAsinNear('best spec') || findAsinNear('spec'),
    bestRated: findAsinNear('best rated') || findAsinNear('rated') || findAsinNear('highest'),
    summary: summary.length > 300 ? summary.slice(0, 297) + '...' : summary,
    generatedAt: Date.now(),
  };
}
