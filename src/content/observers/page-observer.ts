import { isProductPage } from '../extractor';

/** Watch for Amazon SPA-style URL changes and call onNavigate when landing on a product page */
export function observePageChanges(onNavigate: () => void): () => void {
  let lastUrl = location.href;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (isProductPage()) {
        // Small delay to let Amazon render the page content
        setTimeout(onNavigate, 300);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
