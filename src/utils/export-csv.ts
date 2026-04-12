import type { Product } from '../types/product';
import type { ComparedRow } from '../types/comparison';

function escapeCsv(val: string): string {
  if (/[",\n\r]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportToCsv(products: Product[], rows: ComparedRow[]): void {
  // Header row: "Attribute", product1 title, product2 title, ...
  const header = ['Attribute', ...products.map((p) => escapeCsv(p.title))];

  const dataRows = rows.map((row) => {
    const cells = products.map((p) => {
      const cell = row.cells.find((c) => c.productAsin === p.asin);
      const val = cell?.value;
      if (val === null || val === undefined) return '';
      return escapeCsv(String(val));
    });
    return [escapeCsv(row.label), ...cells];
  });

  const csvContent = [header, ...dataRows].map((r) => r.join(',')).join('\n');

  // Generate filename from first two product titles
  const nameSlug = products
    .slice(0, 2)
    .map((p) => p.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_'))
    .join('_vs_');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comparison_${nameSlug}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
