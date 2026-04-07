import { createRoot } from 'react-dom/client';
import React from 'react';
import { FloatingAddWidget } from '../../components/FloatingAddWidget';
import type { Product } from '../../types/product';

type ProductWithPageText = Product & { pageText?: string };

const HOST_ID = 'pc-add-widget-root';

/**
 * Mount the floating "Compare" widget on the right edge of the page.
 * No Amazon DOM selectors needed — appended directly to body.
 */
export function injectAddToCompareButton(product: ProductWithPageText): void {
  // Remove any existing widget (e.g. after SPA navigation to a new product)
  removeAddToCompareButton();

  const host = document.createElement('div');
  host.id = HOST_ID;

  // Inline styles only — no Shadow DOM needed since we control everything via inline styles
  // and the fixed positioning keeps us out of Amazon's layout flow
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483646;';

  document.body.appendChild(host);
  createRoot(host).render(React.createElement(FloatingAddWidget, { product }));
}

export function removeAddToCompareButton(): void {
  document.getElementById(HOST_ID)?.remove();
}
