import { describe, it, expect } from 'vitest';
import { computeDiff } from '../../../src/utils/diff';
import { Product } from '../../../src/types/product';

const makeProduct = (overrides: Partial<Product> & { asin: string }): Product => ({
  asin: overrides.asin,
  title: overrides.title ?? 'Test Product',
  price: overrides.price ?? 29.99,
  currency: 'USD',
  priceFormatted: `$${overrides.price ?? 29.99}`,
  rating: overrides.rating ?? 4.5,
  reviewCount: overrides.reviewCount ?? 100,
  brand: 'TestBrand',
  imageUrl: '',
  productUrl: `https://amazon.com/dp/${overrides.asin}`,
  isPrime: false,
  availability: 'In Stock',
  attributes: overrides.attributes ?? [],
  attributesPartial: false,
  extractedAt: Date.now(),
  pageLocale: 'en-US',
});

describe('computeDiff', () => {
  it('returns empty array for < 2 products', () => {
    expect(computeDiff([])).toHaveLength(0);
    expect(computeDiff([makeProduct({ asin: 'A' })])).toHaveLength(0);
  });

  it('marks price: cheapest as best, most expensive as worst', () => {
    const products = [
      makeProduct({ asin: 'A', price: 49.99 }),
      makeProduct({ asin: 'B', price: 29.99 }),
      makeProduct({ asin: 'C', price: 69.99 }),
    ];
    const rows = computeDiff(products);
    const priceRow = rows.find((r) => r.key === 'price');
    expect(priceRow).toBeDefined();
    expect(priceRow!.cells.find((c) => c.productAsin === 'B')?.diff).toBe('best');
    expect(priceRow!.cells.find((c) => c.productAsin === 'C')?.diff).toBe('worst');
  });

  it('marks rating: highest as best, lowest as worst', () => {
    const products = [
      makeProduct({ asin: 'A', rating: 4.5 }),
      makeProduct({ asin: 'B', rating: 3.2 }),
    ];
    const rows = computeDiff(products);
    const ratingRow = rows.find((r) => r.key === 'rating');
    expect(ratingRow!.cells.find((c) => c.productAsin === 'A')?.diff).toBe('best');
    expect(ratingRow!.cells.find((c) => c.productAsin === 'B')?.diff).toBe('worst');
  });

  it('marks same-value rows as same with hasDifference=false', () => {
    const products = [
      makeProduct({ asin: 'A', price: 29.99 }),
      makeProduct({ asin: 'B', price: 29.99 }),
    ];
    const rows = computeDiff(products);
    const priceRow = rows.find((r) => r.key === 'price');
    expect(priceRow!.hasDifference).toBe(false);
    expect(priceRow!.cells.every((c) => c.diff === 'same')).toBe(true);
  });

  it('includes LLM-extracted attributes in rows', () => {
    const products = [
      makeProduct({ asin: 'A', attributes: [{ key: 'battery_life', label: 'Battery Life', value: '30', rawValue: '30 hours', unit: 'hours' }] }),
      makeProduct({ asin: 'B', attributes: [{ key: 'battery_life', label: 'Battery Life', value: '20', rawValue: '20 hours', unit: 'hours' }] }),
    ];
    const rows = computeDiff(products);
    const batteryRow = rows.find((r) => r.key === 'battery_life');
    expect(batteryRow).toBeDefined();
    expect(batteryRow!.hasDifference).toBe(true);
  });

  it('skips rows where all products have null value', () => {
    const products = [
      makeProduct({ asin: 'A', attributes: [] }),
      makeProduct({ asin: 'B', attributes: [] }),
    ];
    const rows = computeDiff(products);
    // No attribute rows, only core rows with actual values
    const attrRows = rows.filter((r) => !['price', 'rating', 'reviewCount', 'isPrime', 'availability', 'brand'].includes(r.key));
    expect(attrRows).toHaveLength(0);
  });
});
