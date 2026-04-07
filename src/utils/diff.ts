import type { Product } from '../types/product';
import type { ComparedRow, ComparedCell, AttributeDiff } from '../types/comparison';

const LOWER_IS_BETTER = new Set(['price']);
const HIGHER_IS_BETTER = new Set(['rating', 'review_count', 'reviewcount', 'reviews']);

function assignNumericDiff(cells: ComparedCell[], key: string): void {
  const numeric = cells
    .map((c) => ({ asin: c.productAsin, val: Number(c.value) }))
    .filter((c) => !isNaN(c.val) && c.val !== null);

  if (numeric.length < 2) return;

  const lowerIsBetter = LOWER_IS_BETTER.has(key.toLowerCase());
  const higherIsBetter = HIGHER_IS_BETTER.has(key.toLowerCase());

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

  // Always include core fields first
  const coreKeys = ['price', 'rating', 'reviewCount', 'isPrime', 'availability', 'brand'];

  // Collect all unique attribute keys from LLM-extracted attributes
  const attrKeys = [
    ...new Set(products.flatMap((p) => p.attributes.map((a) => a.key))),
  ];

  const allKeys = [...coreKeys, ...attrKeys.filter((k) => !coreKeys.includes(k))];

  return allKeys
    .map((key): ComparedRow | null => {
      const cells: ComparedCell[] = products.map((p) => {
        let value: string | number | boolean | null = null;

        // Core fields from Product directly
        if (key === 'price') value = p.price;
        else if (key === 'rating') value = p.rating;
        else if (key === 'reviewCount') value = p.reviewCount;
        else if (key === 'isPrime') value = p.isPrime;
        else if (key === 'availability') value = p.availability;
        else if (key === 'brand') value = p.brand;
        else {
          const attr = p.attributes.find((a) => a.key === key);
          value = attr?.value ?? null;
        }

        return { productAsin: p.asin, value, diff: 'neutral' as AttributeDiff };
      });

      // Skip rows where ALL values are null
      if (cells.every((c) => c.value === null)) return null;

      const hasDifference = new Set(cells.map((c) => String(c.value))).size > 1;

      // For same-value rows, mark all as 'same'
      if (!hasDifference) {
        cells.forEach((c) => (c.diff = 'same'));
      } else {
        assignNumericDiff(cells, key);
      }

      const label = getLabelForKey(key, products);

      return { key, label, cells, hasDifference };
    })
    .filter((row): row is ComparedRow => row !== null);
}

function getLabelForKey(key: string, products: Product[]): string {
  const labels: Record<string, string> = {
    price: 'Price',
    rating: 'Rating',
    reviewCount: 'Reviews',
    isPrime: 'Prime',
    availability: 'Availability',
    brand: 'Brand',
  };
  if (labels[key]) return labels[key];

  // Check LLM-extracted attribute labels
  for (const p of products) {
    const attr = p.attributes.find((a) => a.key === key);
    if (attr?.label) return attr.label;
  }

  // Fallback: humanize snake_case
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
