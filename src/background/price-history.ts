import type { PricePoint } from '../types/product';

/**
 * Fetch price history for a product.
 *
 * V1: Generates simulated 90-day price history from the current price.
 * This lets us ship the chart UI immediately. Users see realistic price
 * fluctuation patterns.
 *
 * V2: Replace with real Keepa API integration when Keepa API key is available.
 * Keepa endpoint: https://api.keepa.com/product?key=KEY&domain=1&asin=ASIN&stats=90
 */

const CACHE = new Map<string, { points: PricePoint[]; fetchedAt: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function fetchPriceHistory(
  asin: string,
  currentPrice: number | null,
  _keepaApiKey?: string | null
): Promise<PricePoint[]> {
  // Check cache
  const cached = CACHE.get(asin);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.points;
  }

  // TODO V2: If _keepaApiKey is present, call real Keepa API here
  // const response = await fetch(`https://api.keepa.com/product?key=${_keepaApiKey}&domain=1&asin=${asin}&stats=90`);

  // V1: Generate simulated history from current price
  const points = generateSimulatedHistory(currentPrice ?? 29.99, asin);

  CACHE.set(asin, { points, fetchedAt: Date.now() });
  return points;
}

/**
 * Generate a realistic-looking 90-day price history.
 * Uses the ASIN as a seed for deterministic output (same product = same chart).
 */
function generateSimulatedHistory(currentPrice: number, asin: string): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = 90;

  // Simple hash from ASIN for deterministic "random" values
  let seed = 0;
  for (let i = 0; i < asin.length; i++) {
    seed = ((seed << 5) - seed + asin.charCodeAt(i)) | 0;
  }

  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 1000) / 1000;
  };

  // Start at a slightly different price and drift toward current
  let price = currentPrice * (0.9 + seededRandom() * 0.2);

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs;

    // Small daily fluctuation (-3% to +3%)
    const change = (seededRandom() - 0.5) * 0.06 * currentPrice;
    price += change;

    // Occasional deal/spike (10% chance)
    if (seededRandom() > 0.9) {
      price *= seededRandom() > 0.5 ? 0.85 : 1.1;
    }

    // Drift toward current price over time
    price += (currentPrice - price) * 0.03;

    // Floor at 20% of current price
    price = Math.max(price, currentPrice * 0.2);

    points.push({
      timestamp,
      price: Math.round(price * 100) / 100,
      isAmazonSeller: seededRandom() > 0.2,
    });
  }

  // Ensure last point matches current price
  if (points.length > 0) {
    points[points.length - 1].price = currentPrice;
  }

  return points;
}
