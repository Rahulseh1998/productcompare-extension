import React, { useEffect, useState } from 'react';
import type { Product } from '../../types/product';

interface Props {
  product: Product & { pageText?: string };
}

type ButtonState = 'idle' | 'added' | 'loading' | 'full';

export function AddToCompareButton({ product }: Props) {
  const [state, setState] = useState<ButtonState>('idle');

  useEffect(() => {
    // Check if product already in list
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (response) => {
      if (response?.products?.find((p: Product) => p.asin === product.asin)) {
        setState('added');
      }
    });

    const handleUpdate = (e: Event) => {
      const products = (e as CustomEvent).detail?.products as Product[];
      if (products?.find((p) => p.asin === product.asin)) {
        setState('added');
      } else {
        setState('idle');
      }
    };

    window.addEventListener('pc:compare-list-updated', handleUpdate);
    return () => window.removeEventListener('pc:compare-list-updated', handleUpdate);
  }, [product.asin]);

  const handleClick = () => {
    if (state === 'added') return;
    setState('loading');

    chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', product }, (response) => {
      if (response?.success) {
        setState('added');
      } else if (response?.reason === 'limit_reached') {
        setState('full');
        setTimeout(() => setState('idle'), 3000);
      } else {
        setState('idle');
      }
    });
  };

  const config: Record<ButtonState, { label: string; bg: string; cursor: string }> = {
    idle: { label: '+ Add to Compare', bg: '#e47911', cursor: 'pointer' },
    loading: { label: 'Adding...', bg: '#c45e00', cursor: 'wait' },
    added: { label: '✓ Added to Compare', bg: '#067D62', cursor: 'default' },
    full: { label: 'Compare list full — Upgrade for more', bg: '#888', cursor: 'default' },
  };

  const { label, bg, cursor } = config[state];

  return (
    <button
      onClick={handleClick}
      data-testid="add-to-compare-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        marginTop: '10px',
        background: bg,
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'system-ui, sans-serif',
        cursor,
        transition: 'background 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
