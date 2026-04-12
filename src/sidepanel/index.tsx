import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ComparisonTable } from './components/ComparisonTable';
import { VerdictSection } from './components/VerdictSection';
import { PriceHistoryChart } from './components/PriceHistoryChart';
import { ProGate } from '../components/ProGate';
import { ReviewPrompt } from './components/ReviewPrompt';
import { useStore } from '../store';
import type { Product } from '../types/product';
import type { ExtensionMessage } from '../types/messages';

type Tab = 'attributes' | 'price-history';

function SidePanel() {
  const { products, setProducts, removeProduct, clearAll, settings, license, setLicense } = useStore();
  const isPro = license.plan === 'pro';
  const [activeTab, setActiveTab] = useState<Tab>('attributes');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (res) => {
      if (res?.products) setProducts(res.products);
    });

    chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' }, (res) => {
      if (res?.plan) {
        setLicense({ ...license, plan: res.plan, expiresAt: res.expiresAt });
      }
    });

    const listener = (msg: ExtensionMessage) => {
      if (msg.type === 'COMPARE_LIST_UPDATED') {
        setProducts((msg as { products: Product[] } & ExtensionMessage).products);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const showTabs = products.length >= 2;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <span style={{ fontSize: '18px' }}>🛒</span>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>CompareCart</span>
        {!isPro && (
          <a
            href="http://localhost:3000/pro"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}
          >
            Upgrade to Pro →
          </a>
        )}
      </div>

      {/* Review prompt — shows after 3rd comparison, once */}
      <ReviewPrompt />

      {/* AI Verdict — pinned at top, always visible when 2+ products */}
      {showTabs && (
        <ProGate featureName="AI Verdict" isPro={isPro}>
          <VerdictSection products={products} />
        </ProGate>
      )}

      {/* Tabs */}
      {showTabs && (
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', background: '#fafafa' }}>
          <TabButton label="Attributes" active={activeTab === 'attributes'} onClick={() => setActiveTab('attributes')} />
          <TabButton label="Price History" active={activeTab === 'price-history'} onClick={() => setActiveTab('price-history')} />
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'attributes' ? (
          <ComparisonTable
            products={products}
            dimIdenticalRows={settings.dimIdenticalRows}
            isPro={isPro}
            onRemove={removeProduct}
            onClearAll={clearAll}
          />
        ) : (
          <ProGate featureName="Price History" isPro={isPro}>
            <PriceHistoryChart products={products} />
          </ProGate>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        color: active ? '#e47911' : '#6b7280',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #e47911' : '2px solid transparent',
        marginBottom: -2,
        cursor: 'pointer',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<SidePanel />);
