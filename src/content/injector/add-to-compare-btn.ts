import { createRoot } from 'react-dom/client';
import React from 'react';
import { AddToCompareButton } from '../../components/AddToCompareButton';
import type { Product } from '../../types/product';
import { SELECTORS } from '../extractor/selectors';

const HOST_ID = 'pc-add-btn-root';

/** Find the best insertion point near the buy box or title */
function findInsertionPoint(): Element | null {
  // Try title block first — insert after it
  for (const sel of [SELECTORS.TITLE_BLOCK, ...SELECTORS.BUY_BOX]) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export async function injectAddToCompareButton(
  product: Product & { pageText?: string }
): Promise<void> {
  if (document.getElementById(HOST_ID)) return;

  const insertionEl = findInsertionPoint();
  if (!insertionEl) return;

  // Create Shadow DOM host for CSS isolation
  const host = document.createElement('div');
  host.id = HOST_ID;

  const shadow = host.attachShadow({ mode: 'open' });
  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  // Insert after the target element
  insertionEl.parentNode?.insertBefore(host, insertionEl.nextSibling);

  createRoot(mountPoint).render(
    React.createElement(AddToCompareButton, { product })
  );
}

export function removeAddToCompareButton(): void {
  document.getElementById(HOST_ID)?.remove();
}
