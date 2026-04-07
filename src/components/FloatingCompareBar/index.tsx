import React, { useEffect, useState } from 'react';
import type { Product } from '../../types/product';

/**
 * Cross-category detection: soft warning approach (v1).
 *
 * We detect likely category mismatch by comparing the broad product category
 * inferred from the page URL or product title keywords. When mixed, we show
 * a warning badge in the bar — but never block the user from comparing.
 *
 * Future option (v2 — category-scoped sessions):
 *   When adding a product from a clearly different category (e.g. Electronics → Kitchen),
 *   prompt: "You're now viewing a Kitchen product. Start a new comparison or continue?"
 *   Implementation: read category from Amazon breadcrumbs (#wayfinding-breadcrumbs_feature_div),
 *   store the first product's category in chrome.storage.session, compare on each ADD_PRODUCT.
 *   Block route: return { success: false, reason: 'category_mismatch', currentCategory, newCategory }
 *   from the background ADD_PRODUCT handler and show a confirmation dialog in the widget.
 */

/** Rough category bucket from product URL/title — good enough for soft warning */
function inferCategoryBucket(product: Product): string {
  const breadcrumb = document.querySelector('#wayfinding-breadcrumbs_feature_div')?.textContent ?? '';
  const text = (breadcrumb + ' ' + product.title).toLowerCase();

  if (/laptop|computer|monitor|keyboard|mouse|tablet|ipad|macbook|chromebook/.test(text)) return 'electronics-computing';
  if (/headphone|speaker|earbu|airpod|audio|sound/.test(text)) return 'electronics-audio';
  if (/phone|smartphone|iphone|android|charger|cable/.test(text)) return 'electronics-mobile';
  if (/kitchen|cookware|pot|pan|kettle|teapot|blender|toaster|coffee/.test(text)) return 'kitchen';
  if (/clothing|shirt|pants|dress|shoe|jacket|underwear/.test(text)) return 'clothing';
  if (/book|novel|textbook|kindle/.test(text)) return 'books';
  if (/supplement|vitamin|protein|fitness|gym/.test(text)) return 'health';
  if (/toy|game|puzzle|lego/.test(text)) return 'toys';
  return 'other';
}

function hasMixedCategories(products: Product[]): boolean {
  if (products.length < 2) return false;
  const buckets = products.map(inferCategoryBucket);
  return new Set(buckets).size > 1;
}

const BAR_STYLES: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: '#fff',
  borderTop: '2px solid #e47911',
  boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 20px',
  zIndex: 2147483647,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  transition: 'transform 0.2s',
};

interface ProductChipProps {
  product: Product;
  onRemove: (asin: string) => void;
}

function ProductChip({ product, onRemove }: ProductChipProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f7f7f7', borderRadius: '6px', padding: '4px 8px', maxWidth: '140px' }}>
      {product.imageUrl && (
        <img src={product.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: '4px' }} />
      )}
      <span style={{ fontSize: '11px', color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '80px' }}>
        {product.title}
      </span>
      <button
        onClick={() => onRemove(product.asin)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

export function FloatingCompareBar() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Load current list
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (res) => {
      if (res?.products) setProducts(res.products);
    });

    const handleUpdate = (e: Event) => {
      const updated = (e as CustomEvent).detail?.products as Product[];
      if (updated) setProducts(updated);
    };

    window.addEventListener('pc:compare-list-updated', handleUpdate);
    return () => window.removeEventListener('pc:compare-list-updated', handleUpdate);
  }, []);

  const handleRemove = (asin: string) => {
    chrome.runtime.sendMessage({ type: 'REMOVE_PRODUCT', asin });
  };

  const handleCompare = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
  };

  if (products.length === 0) return null;

  return (
    <div style={{ ...BAR_STYLES, transform: collapsed ? 'translateY(calc(100% - 36px))' : 'translateY(0)' }}
      data-testid="floating-compare-bar">
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', padding: '2px 8px', color: '#666', whiteSpace: 'nowrap' }}
      >
        {collapsed ? '▲ Compare' : '▼ Hide'}
      </button>

      {/* Product chips */}
      <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
        {products.map((p) => (
          <ProductChip key={p.asin} product={p} onRemove={handleRemove} />
        ))}
      </div>

      {/* Mixed-category soft warning */}
      {hasMixedCategories(products) && (
        <span title="Products appear to be from different categories. The comparison will still work, but some attributes may not align." style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', cursor: 'default' }}>
          ⚠ Mixed categories
        </span>
      )}

      {/* Count badge */}
      <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
        {products.length}/5 added
      </span>

      {/* Compare Now CTA */}
      <button
        onClick={handleCompare}
        disabled={products.length < 2}
        data-testid="compare-now-btn"
        style={{
          padding: '8px 18px',
          background: products.length >= 2 ? '#e47911' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '13px',
          cursor: products.length >= 2 ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
          transition: 'background 0.2s',
        }}
      >
        Compare Now →
      </button>
    </div>
  );
}
