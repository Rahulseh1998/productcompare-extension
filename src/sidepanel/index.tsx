import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ComparisonTable } from './components/ComparisonTable';
import { useStore } from '../store';
import type { Product } from '../types/product';
import type { ExtensionMessage } from '../types/messages';

function SidePanel() {
  const { products, setProducts, removeProduct, clearAll, settings, license, setLicense } = useStore();

  useEffect(() => {
    // Hydrate from session storage on mount
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (res) => {
      if (res?.products) setProducts(res.products);
    });

    chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' }, (res) => {
      if (res?.plan) {
        setLicense({ ...license, plan: res.plan, expiresAt: res.expiresAt });
      }
    });

    // Listen for real-time updates
    const listener = (msg: ExtensionMessage) => {
      if (msg.type === 'COMPARE_LIST_UPDATED') {
        setProducts((msg as { products: Product[] } & ExtensionMessage).products);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <span style={{ fontSize: '18px' }}>⚖️</span>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>ProductCompare</span>
        {!useStore.getState().isPro && (
          <a
            href="https://productcompare.app/pro"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}
          >
            Upgrade to Pro →
          </a>
        )}
      </div>

      {/* Main comparison table */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ComparisonTable
          products={products}
          dimIdenticalRows={settings.dimIdenticalRows}
          onRemove={removeProduct}
          onClearAll={clearAll}
        />
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<SidePanel />);
