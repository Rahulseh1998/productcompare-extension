import { SELECTORS } from './selectors';

/** Extract ASIN using multiple fallback strategies */
export function extractAsin(): string | null {
  // 1. URL — most reliable, pattern never changes
  const urlMatch = location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
  if (urlMatch) return urlMatch[1];

  const gpMatch = location.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/);
  if (gpMatch) return gpMatch[1];

  // 2. Hidden input
  const asinInput = document.querySelector<HTMLInputElement>(SELECTORS.ASIN_INPUT);
  if (asinInput?.value) return asinInput.value;

  // 3. data-asin on add-to-cart button
  const atcBtn = document.querySelector<HTMLElement>(SELECTORS.ASIN_ADD_TO_CART);
  const dataAsin = atcBtn?.dataset?.asin ?? atcBtn?.getAttribute('data-asin');
  if (dataAsin) return dataAsin;

  // 4. Search detail bullets text
  const bulletText = document.querySelector('#detailBulletsWrapper_feature_div')?.textContent ?? '';
  const bulletMatch = bulletText.match(/ASIN\s*[:\s]+([A-Z0-9]{10})/);
  if (bulletMatch) return bulletMatch[1];

  return null;
}
