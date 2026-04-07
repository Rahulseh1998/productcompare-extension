import { createRoot } from 'react-dom/client';
import React from 'react';
import { FloatingCompareBar } from '../../components/FloatingCompareBar';

const HOST_ID = 'pc-compare-bar-root';

export function mountCompareBar(): void {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  document.body.appendChild(host);

  // No Shadow DOM for the bar — it's full-viewport-width fixed and needs
  // to stack above Amazon's z-index. We use inline styles for isolation.
  createRoot(host).render(React.createElement(FloatingCompareBar));
}
