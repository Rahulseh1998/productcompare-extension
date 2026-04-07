import type { Product } from '../../types/product';
import { SELECTORS } from './selectors';
import { extractAsin } from './asin-extractor';
import { extractPrice } from './price-extractor';
import { harvestSections, buildPageText } from './section-harvester';
import { extractStructuredSpecs } from './specs-extractor';

export function isProductPage(): boolean {
  return /\/dp\/|\/gp\/product\//.test(location.pathname);
}

function extractDirectFields() {
  const { price, currency, priceFormatted } = extractPrice();

  let rating: number | null = null;
  for (const sel of SELECTORS.RATING) {
    const text = document.querySelector(sel)?.textContent;
    if (text) {
      const match = text.match(/(\d+\.?\d*)/);
      if (match) { rating = parseFloat(match[1]); break; }
    }
  }

  let reviewCount: number | null = null;
  for (const sel of SELECTORS.REVIEW_COUNT) {
    const text = document.querySelector(sel)?.textContent;
    if (text) {
      const cleaned = text.replace(/[^0-9]/g, '');
      if (cleaned) { reviewCount = parseInt(cleaned, 10); break; }
    }
  }

  let imageUrl = '';
  for (const sel of SELECTORS.MAIN_IMAGE) {
    const src = document.querySelector<HTMLImageElement>(sel)?.src;
    if (src) { imageUrl = src; break; }
  }

  let brand: string | null = null;
  for (const sel of SELECTORS.BRAND) {
    const text = document.querySelector(sel)?.textContent?.trim();
    if (text) {
      brand = text.replace(/^(Visit the|Brand:|by)\s*/i, '').trim();
      break;
    }
  }

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
 * Attribute population has two tiers:
 *
 * Tier 1 — Structured spec parsing (always runs, instant, no API needed):
 *   Parses Amazon's spec tables and detail bullets directly as key:value pairs.
 *   Gives 5-15 attributes per product (weight, dimensions, battery, RAM, etc.)
 *   depending on how much structured data Amazon shows for that category.
 *
 * Tier 2 — LLM enrichment via Claude Haiku (runs when API key is set):
 *   Sends harvested page text to background → Claude extracts up to 20 attributes
 *   from prose bullet points that don't appear in structured tables.
 *   Results are cached by ASIN for 24 hours.
 *   If no API key is configured, Tier 1 attributes are shown as-is.
 */
export function extractProductDirect(): Product | null {
  const asin = extractAsin();
  if (!asin) return null;

  const direct = extractDirectFields();
  if (!direct.title) return null;

  // Tier 1: parse structured specs immediately — no LLM, no latency
  const structuredAttributes = extractStructuredSpecs();

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
    attributes: structuredAttributes,
    // attributesPartial stays true until LLM enrichment completes (if API key present)
    attributesPartial: true,
    extractedAt: Date.now(),
    pageLocale: document.documentElement.lang ?? 'en-US',
  };
}

/**
 * Harvest page text for LLM attribute enrichment (Tier 2).
 * Only called when user adds a product — text is sent to background
 * which calls Claude Haiku if an API key is configured.
 */
export function harvestPageTextForLLM(): string {
  const sections = harvestSections();
  return buildPageText(sections);
}
