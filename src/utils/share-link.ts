import pako from 'pako';
import type { Product } from '../types/product';
import type { ComparedRow } from '../types/comparison';

const BASE_URL = 'http://localhost:3000/compare';
const MAX_ROWS = 25;

export function encodeComparisonUrl(products: Product[], rows?: ComparedRow[]): string {
  const compactRows = rows
    ?.filter((r) => !r.cells.every((c) => c.value === null))
    .slice(0, MAX_ROWS)
    .map((r) => ({
      l: r.label,
      d: r.hasDifference,
      v: products.map((p) => {
        const cell = r.cells.find((c) => c.productAsin === p.asin);
        const val = cell?.value;
        return val === null || val === undefined ? null : String(val);
      }),
    }));

  const payload = {
    v: 2,
    a: products.map((p) => p.asin),
    lc: products[0]?.pageLocale ?? 'en-US',
    t: products.map((p) => p.title.slice(0, 60)),
    p: products.map((p) => p.priceFormatted || null),
    rt: products.map((p) => p.rating),
    im: products.map((p) => p.imageUrl),
    r: compactRows ?? [],
  };

  // Compress with gzip then base64url encode (URL-safe)
  const json = JSON.stringify(payload);
  const compressed = pako.deflate(new TextEncoder().encode(json));
  const base64 = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${BASE_URL}?z=${base64}`;
}
