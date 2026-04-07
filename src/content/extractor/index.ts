import type { Product } from '../../types/product';
import { SELECTORS } from './selectors';
import { extractAsin } from './asin-extractor';
import { extractPrice } from './price-extractor';
import { harvestSections, buildPageText } from './section-harvester';

export function isProductPage(): boolean {
  return /\/dp\/|\/gp\/product\//.test(location.pathname);
}

/** Extract all fields that don't require LLM (fast path) */
function extractDirectFields() {
  const { price, currency, priceFormatted } = extractPrice();

  // Rating
  let rating: number | null = null;
  for (const sel of SELECTORS.RATING) {
    const text = document.querySelector(sel)?.textContent;
    if (text) {
      const match = text.match(/(\d+\.?\d*)/);
      if (match) { rating = parseFloat(match[1]); break; }
    }
  }

  // Review count
  let reviewCount: number | null = null;
  for (const sel of SELECTORS.REVIEW_COUNT) {
    const text = document.querySelector(sel)?.textContent;
    if (text) {
      const cleaned = text.replace(/[^0-9]/g, '');
      if (cleaned) { reviewCount = parseInt(cleaned, 10); break; }
    }
  }

  // Main image
  let imageUrl = '';
  for (const sel of SELECTORS.MAIN_IMAGE) {
    const src = document.querySelector<HTMLImageElement>(sel)?.src;
    if (src) { imageUrl = src; break; }
  }

  // Brand
  let brand: string | null = null;
  for (const sel of SELECTORS.BRAND) {
    const text = document.querySelector(sel)?.textContent?.trim();
    if (text) {
      brand = text.replace(/^(Visit the|Brand:|by)\s*/i, '').trim();
      break;
    }
  }

  // Title
  let title = '';
  for (const sel of SELECTORS.TITLE) {
    const text = document.querySelector(sel)?.textContent?.trim();
    if (text) { title = text; break; }
  }

  const isPrime = !!document.querySelector(SELECTORS.PRIME_BADGE);
  const availability = document.querySelector(SELECTORS.AVAILABILITY)?.textContent?.trim() ?? 'In Stock';

  return { title, price, currency, priceFormatted, rating, reviewCount, imageUrl, brand, isPrime, availability };
}

/**
 * Extract a Product from the current Amazon product page.
 *
 * Returns a partial product immediately (direct fields only).
 * The LLM attribute extraction happens asynchronously via the background service worker.
 * Call sendExtractionToBackground() to trigger it.
 */
export function extractProductDirect(): Product | null {
  const asin = extractAsin();
  if (!asin) return null;

  const direct = extractDirectFields();
  if (!direct.title) return null;

  return {
    asin,
    title: direct.title,
    price: direct.price,
    currency: direct.currency,
    priceFormatted: direct.priceFormatted,
    rating: direct.rating,
    reviewCount: direct.reviewCount,
    brand: direct.brand,
    imageUrl: direct.imageUrl,
    productUrl: location.href,
    isPrime: direct.isPrime,
    availability: direct.availability,
    attributes: [],
    attributesPartial: true,
    extractedAt: Date.now(),
    pageLocale: document.documentElement.lang ?? 'en-US',
  };
}

/**
 * Harvest page text for LLM attribute extraction.
 * Returns the structured text string to send to the background worker.
 */
export function harvestPageTextForLLM(): string {
  const sections = harvestSections();
  return buildPageText(sections);
}
