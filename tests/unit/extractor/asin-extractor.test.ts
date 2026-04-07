import { describe, it, expect, beforeEach } from 'vitest';
import { extractAsin } from '../../../src/content/extractor/asin-extractor';

describe('extractAsin', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts ASIN from /dp/ URL', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dp/B08N5WRWNW', href: 'https://www.amazon.com/dp/B08N5WRWNW' },
      writable: true,
    });
    expect(extractAsin()).toBe('B08N5WRWNW');
  });

  it('extracts ASIN from /gp/product/ URL', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/gp/product/B07XJ8C8F5', href: 'https://www.amazon.com/gp/product/B07XJ8C8F5' },
      writable: true,
    });
    expect(extractAsin()).toBe('B07XJ8C8F5');
  });

  it('falls back to hidden input', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/some-other-path', href: 'https://www.amazon.com/some-other-path' },
      writable: true,
    });
    document.body.innerHTML = `<input name="ASIN" value="B0ABCD1234" />`;
    expect(extractAsin()).toBe('B0ABCD1234');
  });

  it('returns null when no ASIN found', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/not-a-product', href: 'https://www.amazon.com/not-a-product' },
      writable: true,
    });
    document.body.innerHTML = '';
    expect(extractAsin()).toBeNull();
  });
});
