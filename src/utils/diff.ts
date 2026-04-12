import type { Product } from '../types/product';
import type { ComparedRow, ComparedCell, AttributeDiff } from '../types/comparison';
import { normalizeKey, deduplicateAttributes } from './normalize-keys';

const LOWER_IS_BETTER = new Set(['price']);
const HIGHER_IS_BETTER = new Set(['rating', 'reviewcount', 'review']);

/** Cross-product: drop child rows when a composite parent row exists */
const SUBSUMES: Record<string, string[]> = {
  dimension: ['depth', 'width', 'height'],
};

function assignNumericDiff(cells: ComparedCell[], normalizedKey: string): void {
  const numeric = cells
    .map((c) => ({ asin: c.productAsin, val: Number(c.value) }))
    .filter((c) => !isNaN(c.val) && c.val !== null);

  if (numeric.length < 2) return;

  const lowerIsBetter = LOWER_IS_BETTER.has(normalizedKey);
  const higherIsBetter = HIGHER_IS_BETTER.has(normalizedKey);

  if (!lowerIsBetter && !higherIsBetter) return;

  const sorted = [...numeric].sort((a, b) =>
    lowerIsBetter ? a.val - b.val : b.val - a.val
  );

  const bestAsin = sorted[0].asin;
  const worstAsin = sorted[sorted.length - 1].asin;

  cells.forEach((c) => {
    if (c.productAsin === bestAsin) c.diff = 'best';
    else if (c.productAsin === worstAsin) c.diff = 'worst';
  });
}

export function computeDiff(products: Product[]): ComparedRow[] {
  if (products.length < 2) return [];

  // Deduplicate attributes within each product first
  const cleanProducts = products.map((p) => ({
    ...p,
    attributes: deduplicateAttributes(p.attributes),
  }));

  // Core fields — always shown first
  const coreKeys = ['price', 'rating', 'reviewCount', 'isPrime', 'availability', 'brand'];
  const normalizedCoreKeys = new Set(coreKeys.map(normalizeKey));

  // Build a map: normalizedKey → { bestLabel }
  // Groups "microphones"/"microphone", "voice_assistant_compatible"/"voice_assistant" into same row
  const keyGroups = new Map<string, { label: string }>();

  for (const p of cleanProducts) {
    for (const attr of p.attributes) {
      const nk = normalizeKey(attr.key);
      if (normalizedCoreKeys.has(nk)) continue;

      const group = keyGroups.get(nk);
      if (group) {
        if (attr.label.length > group.label.length) {
          group.label = attr.label;
        }
      } else {
        keyGroups.set(nk, { label: attr.label });
      }
    }
  }

  // Remove sub-keys when composite parent exists (e.g. depth/width/height when dimensions exists)
  const allNormalized = new Set(keyGroups.keys());
  for (const [parent, children] of Object.entries(SUBSUMES)) {
    if (allNormalized.has(parent)) {
      for (const child of children) {
        keyGroups.delete(child);
      }
    }
  }

  const allKeys: { nk: string; label: string; isCore: boolean }[] = [
    ...coreKeys.map((k) => ({ nk: k, label: getLabelForCoreKey(k), isCore: true })),
    ...[...keyGroups.entries()].map(([nk, g]) => ({ nk, label: g.label, isCore: false })),
  ];

  return allKeys
    .map(({ nk, label, isCore }): ComparedRow | null => {
      const cells: ComparedCell[] = cleanProducts.map((p) => {
        let value: string | number | boolean | null = null;

        if (isCore) {
          if (nk === 'price') value = p.price;
          else if (nk === 'rating') value = p.rating;
          else if (nk === 'reviewCount') value = p.reviewCount;
          else if (nk === 'isPrime') value = p.isPrime;
          else if (nk === 'availability') value = p.availability;
          else if (nk === 'brand') value = p.brand;
        } else {
          // Find attribute by normalized key match
          const attr = p.attributes.find((a) => normalizeKey(a.key) === nk);
          value = attr?.value ?? null;
        }

        return { productAsin: p.asin, value, diff: 'neutral' as AttributeDiff };
      });

      // Skip rows where ALL values are null
      if (cells.every((c) => c.value === null)) return null;

      const hasDifference = new Set(cells.map((c) => String(c.value))).size > 1;

      if (!hasDifference) {
        cells.forEach((c) => (c.diff = 'same'));
      } else {
        assignNumericDiff(cells, nk);
      }

      return { key: nk, label, cells, hasDifference };
    })
    .filter((row): row is ComparedRow => row !== null);
}

function getLabelForCoreKey(key: string): string {
  const labels: Record<string, string> = {
    price: 'Price',
    rating: 'Rating',
    reviewCount: 'Reviews',
    isPrime: 'Prime',
    availability: 'Availability',
    brand: 'Brand',
  };
  return labels[key] ?? key;
}
