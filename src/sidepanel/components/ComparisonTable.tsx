import React, { useMemo } from 'react';
import type { Product } from '../../types/product';
import { computeDiff } from '../../utils/diff';
import { ComparisonHeader } from './ComparisonHeader';
import { AttributeRow } from './AttributeRow';

interface Props {
  products: Product[];
  dimIdenticalRows: boolean;
  onRemove: (asin: string) => void;
  onClearAll: () => void;
}

export function ComparisonTable({ products, dimIdenticalRows, onRemove, onClearAll }: Props) {
  const rows = useMemo(() => computeDiff(products), [products]);

  if (products.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', color: '#6b7280', textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px' }}>⚖️</div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}>No products to compare</p>
        <p style={{ fontSize: '13px' }}>Visit an Amazon product page and click <strong>"+ Add to Compare"</strong> to get started.</p>
      </div>
    );
  }

  if (products.length === 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#6b7280', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px' }}>+1</div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Add one more product to start comparing</p>
        <p style={{ fontSize: '12px' }}>Go to another Amazon product page and click "Add to Compare"</p>
      </div>
    );
  }

  const differenceCount = rows.filter((r) => r.hasDifference).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          {differenceCount} difference{differenceCount !== 1 ? 's' : ''} found across {rows.length} attributes
        </span>
        <button
          onClick={onClearAll}
          style={{ fontSize: '11px', color: '#e47911', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
        >
          Clear all
        </button>
      </div>

      {/* Scrollable table */}
      <div style={{ overflow: 'auto', flex: 1 }} data-testid="comparison-table">
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <ComparisonHeader products={products} onRemove={onRemove} />
          <tbody>
            {rows.map((row) => (
              <AttributeRow
                key={row.key}
                label={row.label}
                cells={row.cells}
                hasDifference={row.hasDifference}
                dimWhenSame={dimIdenticalRows}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
