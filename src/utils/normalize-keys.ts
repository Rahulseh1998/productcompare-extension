import type { ProductAttribute } from '../types/product';

/**
 * Normalize an attribute key so that near-duplicates collapse into the same row.
 *
 * Examples:
 *   "is_dishwasher_safe" → "dishwasher_safe"
 *   "item_weight"        → "weight"
 *   "microphones"        → "microphone"
 *   "Model Name"         → "model"
 *   "product_dimensions" → "dimension"
 *   "With Lid"           → "lid"
 *   "Lid Included"       → "lid"
 *   "Includes Lid"       → "lid"
 *   "Has Lid"            → "lid"
 *   "Dimensions (Depth)" → "depth"
 */
export function normalizeKey(raw: string): string {
  let k = raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')       // "Model Name" → "model_name"
    .replace(/[^a-z0-9_]/g, ''); // strip special chars

  // Strip common noise prefixes
  k = k.replace(/^(is_|item_|product_|has_|total_|with_|include[sd]?_)/, '');

  // Strip noise suffixes
  k = k.replace(/_(name|number|included|type|compatible|supported|enabled|available|rating)$/, '');

  // "dimensions_depth" / "dimensions_width" → "depth" / "width"
  k = k.replace(/^dimension[s]?_/, '');

  // Simple singularize: trailing "s" (but not "ss" like "glass")
  if (k.endsWith('s') && !k.endsWith('ss') && !k.endsWith('us') && k.length > 3) {
    k = k.slice(0, -1);
  }

  return k;
}

/**
 * Keys that are redundant when a more descriptive variant exists.
 * e.g. individual depth/width/height are noise when "product_dimensions" is present.
 */
const SUBSUMES: Record<string, string[]> = {
  dimension: ['depth', 'width', 'height'],
};

/**
 * Deduplicate attributes within a single product.
 * When two attributes share the same normalized key, keep the richer one.
 * Also removes sub-attributes when a parent composite attribute exists
 * (e.g. drop individual depth/width/height when "dimensions" is present).
 */
export function deduplicateAttributes(attrs: ProductAttribute[]): ProductAttribute[] {
  const seen = new Map<string, ProductAttribute>();

  for (const attr of attrs) {
    const nk = normalizeKey(attr.key);
    const existing = seen.get(nk);

    if (!existing) {
      seen.set(nk, attr);
      continue;
    }

    // Keep the richer value
    if (richness(attr) > richness(existing)) {
      seen.set(nk, attr);
    }
  }

  // Remove sub-attributes when the composite parent exists
  const normalizedKeys = new Set(seen.keys());
  for (const [parent, children] of Object.entries(SUBSUMES)) {
    if (normalizedKeys.has(parent)) {
      for (const child of children) {
        seen.delete(child);
      }
    }
  }

  return Array.from(seen.values());
}

function richness(attr: ProductAttribute): number {
  let score = String(attr.rawValue ?? attr.value ?? '').length;
  if (attr.unit) score += 5; // bonus for having a unit
  return score;
}
