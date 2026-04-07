import { isProductPage, extractProductDirect, harvestPageTextForLLM } from './extractor';
import { injectAddToCompareButton, removeAddToCompareButton } from './injector/add-to-compare-btn';
import { mountCompareBar } from './injector/compare-bar';
import { observePageChanges } from './observers/page-observer';
import type { ExtensionMessage } from '../types/messages';

let compareBarMounted = false;

function initForCurrentPage(): void {
  if (!isProductPage()) {
    removeAddToCompareButton();
    return;
  }

  const product = extractProductDirect();
  if (!product) {
    console.debug('[ProductCompare] Could not extract product from this page:', location.href);
    return;
  }

  // Harvest page text now while the DOM is loaded, attach it to the product
  // so the widget can include it when the user manually clicks "Add to Compare".
  // The LLM extraction only runs AFTER the user explicitly adds the product.
  const pageText = harvestPageTextForLLM();
  const productWithPageText = { ...product, pageText };

  // Inject the floating widget — no product is added yet, just the UI
  injectAddToCompareButton(productWithPageText);

  if (!compareBarMounted) {
    mountCompareBar();
    compareBarMounted = true;
  }
}

// ── Listen for compare list updates to sync widget state ──────────────────────

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
