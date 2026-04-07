import type { ProductAttribute } from '../types/product';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  attributes: ProductAttribute[];
  cachedAt: number;
}

function cacheKey(asin: string): string {
  return `extract_cache_${asin}`;
}

export async function getCachedAttributes(asin: string): Promise<ProductAttribute[] | null> {
  const key = cacheKey(asin);
  const result = await chrome.storage.local.get(key);
  const entry: CacheEntry | undefined = result[key];

  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    chrome.storage.local.remove(key);
    return null;
  }

  return entry.attributes;
}

export async function setCachedAttributes(asin: string, attributes: ProductAttribute[]): Promise<void> {
  const key = cacheKey(asin);
  const entry: CacheEntry = { attributes, cachedAt: Date.now() };
  await chrome.storage.local.set({ [key]: entry });
}
