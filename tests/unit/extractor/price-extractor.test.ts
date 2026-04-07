import { describe, it, expect, beforeEach } from 'vitest';
import { extractPrice } from '../../../src/content/extractor/price-extractor';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('extractPrice', () => {
  it('parses offscreen text (most reliable path)', () => {
    document.body.innerHTML = `
      <span class="a-price">
        <span class="a-offscreen">$24.99</span>
      </span>`;
    const result = extractPrice();
    expect(result.price).toBe(24.99);
    expect(result.currency).toBe('USD');
  });

  it('parses GBP prices', () => {
    document.body.innerHTML = `<span class="a-price"><span class="a-offscreen">£19.99</span></span>`;
    const result = extractPrice();
    expect(result.price).toBe(19.99);
    expect(result.currency).toBe('GBP');
  });

  it('falls back to whole + fraction when offscreen missing', () => {
    document.body.innerHTML = `
      <span class="a-price-whole">29,</span>
      <span class="a-price-fraction">99</span>`;
    const result = extractPrice();
    expect(result.price).toBe(29.99);
  });

  it('returns null price when nothing found', () => {
    document.body.innerHTML = `<div>No price here</div>`;
    const result = extractPrice();
    expect(result.price).toBeNull();
    expect(result.priceFormatted).toBe('Price unavailable');
  });

  it('handles prices with commas (e.g. $1,299.99)', () => {
    document.body.innerHTML = `<span class="a-price"><span class="a-offscreen">$1,299.99</span></span>`;
    const result = extractPrice();
    expect(result.price).toBe(1299.99);
  });
});
