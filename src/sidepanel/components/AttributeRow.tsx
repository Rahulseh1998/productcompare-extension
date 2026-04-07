import React from 'react';
import type { ComparedCell } from '../../types/comparison';

interface Props {
  label: string;
  cells: ComparedCell[];
  hasDifference: boolean;
  dimWhenSame: boolean;
}

const CELL_STYLES: Record<string, React.CSSProperties> = {
  best: { background: '#f0fdf4', color: '#166534', fontWeight: 600 },
  worst: { background: '#fef2f2', color: '#991b1b' },
  neutral: { background: '#fff', color: '#374151' },
  same: { background: '#fafafa', color: '#6b7280' },
};

function formatValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓ Yes' : '✗ No';
  return String(value);
}

export function AttributeRow({ label, cells, hasDifference, dimWhenSame }: Props) {
  const dimRow = !hasDifference && dimWhenSame;

  return (
    <tr style={{ opacity: dimRow ? 0.45 : 1, transition: 'opacity 0.15s' }}>
      <td style={{
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 500,
        color: '#374151',
        background: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        whiteSpace: 'nowrap',
        position: 'sticky',
        left: 0,
        minWidth: '120px',
      }}>
        {label}
      </td>
      {cells.map((cell) => (
        <td
          key={cell.productAsin}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            textAlign: 'center',
            borderRight: '1px solid #e5e7eb',
            minWidth: '140px',
            ...CELL_STYLES[cell.diff],
          }}
        >
          {formatValue(cell.value)}
        </td>
      ))}
    </tr>
  );
}
