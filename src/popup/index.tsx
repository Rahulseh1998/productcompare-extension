import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Product } from '../types/product';

function Popup() {
  const [products, setProducts] = useState<Product[]>([]);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (res) => {
      if (res?.products) setProducts(res.products);
    });
    chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' }, (res) => {
      if (res?.plan) setPlan(res.plan);
    });
  }, []);

  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '20px' }}>⚖️</span>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>ProductCompare</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', background: plan === 'pro' ? '#d1fae5' : '#fef3c7', color: plan === 'pro' ? '#065f46' : '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
          {plan.toUpperCase()}
        </span>
      </div>

      {/* Count */}
      <p style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
        {products.length === 0
          ? 'No products in compare list yet.'
          : `${products.length} product${products.length > 1 ? 's' : ''} ready to compare.`}
      </p>

      {/* CTA */}
      <button
        onClick={openSidePanel}
        disabled={products.length < 2}
        style={{
          width: '100%',
          padding: '10px',
          background: products.length >= 2 ? '#e47911' : '#d1d5db',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '13px',
          cursor: products.length >= 2 ? 'pointer' : 'not-allowed',
          marginBottom: '10px',
        }}
      >
        {products.length >= 2 ? 'Open Comparison Panel →' : 'Add products on Amazon first'}
      </button>

      {/* Upgrade banner for free users */}
      {plan === 'free' && (
        <a
          href="https://productcompare.app/pro"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#7c3aed', textDecoration: 'none', padding: '6px', background: '#f5f3ff', borderRadius: '6px' }}
        >
          ✨ Upgrade to Pro — AI verdict + price history + 5 products
        </a>
      )}
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<Popup />);
