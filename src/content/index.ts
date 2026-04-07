import { isProductPage, extractProductDirect, harvestPageTextForLLM } from './extractor';
import { injectAddToCompareButton, removeAddToCompareButton } from './injector/add-to-compare-btn';
import { mountCompareBar } from './injector/compare-bar';
import { observePageChanges } from './observers/page-observer';
import type { Product } from '../types/product';
import type { ExtensionMessage } from '../types/messages';

let compareBarMounted = false;

async function initForCurrentPage(): Promise<void> {
  if (!isProductPage()) return;

  const product = extractProductDirect();
  if (!product) return;

  // Harvest page text and attach it for background LLM extraction
  const pageText = harvestPageTextForLLM();
  const productWithText = { ...product, pageText } as Product & { pageText: string };

  removeAddToCompareButton();
  await injectAddToCompareButton(productWithText);

  if (!compareBarMounted) {
    mountCompareBar();
    compareBarMounted = true;
  }
}

// ── Listen for compare list updates from background ───────────────────────────

chrome.runtime.onMessage.addListener((msg: ExtensionMessage) => {
  if (msg.type === 'COMPARE_LIST_UPDATED') {
    window.dispatchEvent(
      new CustomEvent('pc:compare-list-updated', { detail: { products: msg.products } })
    );
  }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

initForCurrentPage();
observePageChanges(initForCurrentPage);
