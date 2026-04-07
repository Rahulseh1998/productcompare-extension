import { SELECTORS } from './selectors';

export interface PriceResult {
  price: number | null;
  currency: string;
  priceFormatted: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD', '£': 'GBP', '€': 'EUR', '¥': 'JPY', 'CA$': 'CAD',
};

function parsePriceString(raw: string): PriceResult {
  const cleaned = raw.trim().replace(/\s+/g, '');

  // Detect currency
  let currency = 'USD';
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (cleaned.startsWith(symbol)) {
      currency = code;
      break;
    }
  }

  // Remove currency symbols and commas, parse float
  const numericStr = cleaned.replace(/[^0-9.]/g, '');
  const price = numericStr ? parseFloat(numericStr) : null;

  return {
    price: price && !isNaN(price) ? price : null,
    currency,
    priceFormatted: raw.trim(),
  };
}

export function extractPrice(): PriceResult {
  // Strategy 1: screen reader offscreen text — most reliable, format is always "$X.XX"
  const offscreen = document.querySelector<HTMLElement>(SELECTORS.PRICE_OFFSCREEN);
  if (offscreen?.textContent) {
    const result = parsePriceString(offscreen.textContent);
    if (result.price !== null) return result;
  }

  // Strategy 2: combine whole + fraction
  const whole = document.querySelector<HTMLElement>(SELECTORS.PRICE_WHOLE)?.textContent;
  const fraction = document.querySelector<HTMLElement>(SELECTORS.PRICE_FRACTION)?.textContent;
  if (whole) {
    const raw = `${whole.replace(/[^0-9]/g, '')}.${(fraction ?? '00').replace(/[^0-9]/g, '')}`;
    const price = parseFloat(raw);
    if (!isNaN(price)) {
      return { price, currency: 'USD', priceFormatted: `$${price.toFixed(2)}` };
    }
  }

  // Strategy 3: deal price block
  const dealEl = document.querySelector<HTMLElement>(SELECTORS.PRICE_DEAL);
  if (dealEl?.textContent) {
    const result = parsePriceString(dealEl.textContent);
    if (result.price !== null) return result;
  }

  // Strategy 4: price range — take lower bound
  const rangeEl = document.querySelector<HTMLElement>(SELECTORS.PRICE_RANGE);
  if (rangeEl?.textContent) {
    const result = parsePriceString(rangeEl.textContent);
    if (result.price !== null) return result;
  }

  return { price: null, currency: 'USD', priceFormatted: 'Price unavailable' };
}
