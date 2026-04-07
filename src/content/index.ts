import { isProductPage, extractProductDirect, harvestPageTextForLLM } from './extractor';
import { injectAddToCompareButton, removeAddToCompareButton } from './injector/add-to-compare-btn';
import { mountCompareBar } from './injector/compare-bar';
import { observePageChanges } from './observers/page-observer';
import type { ExtensionMessage } from '../types/messages';

let compareBarMounted = false;

function initForCurrentPage(): void {
  if (!isProductPage()) {
    // Not a product page — remove any widget from a previous navigation
    removeAddToCompareButton();
    return;
  }

  const product = extractProductDirect();
  if (!product) {
    // Product data couldn't be extracted — log and bail gracefully
    console.debug('[ProductCompare] Could not extract product from this page:', location.href);
    return;
  }

  // Inject the floating widget (replaces itself if already present)
  injectAddToCompareButton(product);

  // Mount the compare bar once per tab lifetime
  if (!compareBarMounted) {
    mountCompareBar();
    compareBarMounted = true;
  }

  // Fire-and-forget: send page text to background for LLM attribute extraction
  const pageText = harvestPageTextForLLM();
  if (pageText) {
    chrome.runtime.sendMessage({
      type: 'ADD_PRODUCT',
      product: { ...product, pageText } as typeof product & { pageText: string },
    }).catch(() => {
      // Background might not be ready yet — not fatal, user can still add manually
    });
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

// Run immediately on page load
initForCurrentPage();

// Re-run when Amazon's SPA router navigates to a new product
observePageChanges(initForCurrentPage);
