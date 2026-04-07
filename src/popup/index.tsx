import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Product } from '../types/product';

type View = 'main' | 'settings';

function Popup() {
  const [products, setProducts] = useState<Product[]>([]);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [view, setView] = useState<View>('main');
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (res) => {
      if (res?.products) setProducts(res.products);
    });
    chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' }, (res) => {
      if (res?.plan) setPlan(res.plan);
    });
    chrome.storage.local.get('settings', (result) => {
      const key = result.settings?.anthropicApiKey ?? '';
      setApiKey(key);
    });
  }, []);

  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  const saveApiKey = () => {
    chrome.storage.local.get('settings', (result) => {
      const current = result.settings ?? {};
      chrome.storage.local.set({ settings: { ...current, anthropicApiKey: apiKey.trim() || null } }, () => {
        setApiKeySaved(true);
        setTimeout(() => setApiKeySaved(false), 2000);
      });
    });
  };

  if (view === 'settings') {
    return (
      <div style={{ padding: '16px', width: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setView('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, color: '#374151' }}>←</button>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Settings</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Anthropic API Key
          </label>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>
            Required for AI-powered attribute extraction and verdict. Product specs are extracted without it, but the AI enrichment and comparison summary require a key.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
          <button
            onClick={saveApiKey}
            style={{ marginTop: 8, width: '100%', padding: '8px 0', background: apiKeySaved ? '#067D62' : '#e47911', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {apiKeySaved ? '✓ Saved' : 'Save Key'}
          </button>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 8, lineHeight: 1.4 }}>
            Your key is stored locally on your device and never sent to our servers. It's used only to call Anthropic's API directly from your browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', width: 320 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⚖️</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>ProductCompare</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, background: plan === 'pro' ? '#d1fae5' : '#fef3c7', color: plan === 'pro' ? '#065f46' : '#92400e', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
          {plan.toUpperCase()}
        </span>
        <button onClick={() => setView('settings')} title="Settings" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0, color: '#9ca3af' }}>⚙️</button>
      </div>

      {/* Count */}
      <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
        {products.length === 0
          ? 'No products in compare list yet.'
          : `${products.length} product${products.length > 1 ? 's' : ''} ready to compare.`}
      </p>

      {/* API key warning */}
      {!apiKey && (
        <div style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>
          ⚡ Add an Anthropic API key in Settings to enable AI attribute extraction.
        </div>
      )}

      {/* CTA */}
      <button
        onClick={openSidePanel}
        disabled={products.length < 2}
        style={{ width: '100%', padding: 10, background: products.length >= 2 ? '#e47911' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: products.length >= 2 ? 'pointer' : 'not-allowed', marginBottom: 10 }}
      >
        {products.length >= 2 ? 'Open Comparison Panel →' : 'Add products on Amazon first'}
      </button>

      {plan === 'free' && (
        <a href="https://productcompare.app/pro" target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#7c3aed', textDecoration: 'none', padding: '6px', background: '#f5f3ff', borderRadius: 6 }}>
          ✨ Upgrade to Pro — AI verdict + price history + 5 products
        </a>
      )}
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<Popup />);
