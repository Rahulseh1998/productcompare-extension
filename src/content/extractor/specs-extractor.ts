import type { ProductAttribute } from '../../types/product';

/**
 * Parse Amazon's structured spec tables and detail bullets directly.
 *
 * Amazon renders product specifications in two structured formats:
 *   1. <table> rows: <tr><th>Battery Life</th><td>30 hours</td></tr>
 *   2. Bullet list:  <span class="a-list-item"><b>Battery:</b> 30 hours</span>
 *
 * These are parsed as key:value pairs — no LLM needed, instant, free.
 * The LLM extraction (when API key is present) then enriches with attributes
 * found only in prose bullet points that don't follow a structured format.
 *
 * Future option (cross-category blocking):
 *   Read the product category from these specs (e.g. "Electronics > Laptops")
 *   and compare against the existing list's category. Block or warn if different.
 *   For now we use a soft warning in the UI (see FloatingCompareBar).
 */

// Keys to skip — they're either already extracted directly or not useful for comparison
const SKIP_KEYS = new Set([
  'asin', 'item model number', 'date first available', 'manufacturer',
  'best sellers rank', 'customer reviews', 'feedback',
]);

function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function cleanValue(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/**
 * Parse <table> spec rows: <tr><th>Label</th><td>Value</td></tr>
 * Covers: #productDetails_techSpec_section_1, #productDetails_db_sections, etc.
 */
function parseTableSpecs(tableSelector: string): ProductAttribute[] {
  const attrs: ProductAttribute[] = [];
  const rows = document.querySelectorAll(`${tableSelector} tr`);

  rows.forEach((row) => {
    const th = row.querySelector('th')?.textContent?.trim();
    const td = row.querySelector('td')?.textContent?.trim();
    if (!th || !td) return;

    const key = normalizeKey(th);
    if (!key || SKIP_KEYS.has(th.toLowerCase())) return;

    const value = cleanValue(td);
    if (!value || value === '—' || value === '-') return;

    attrs.push({ key, label: th, value, rawValue: td });
  });

  return attrs;
}

/**
 * Parse detail bullet list: <span><b>Label:</b> Value</span>
 * Covers: #detailBulletsWrapper_feature_div
 */
function parseDetailBullets(): ProductAttribute[] {
  const attrs: ProductAttribute[] = [];
  const items = document.querySelectorAll(
    '#detailBulletsWrapper_feature_div .a-list-item'
  );

  items.forEach((item) => {
    const text = item.textContent ?? '';
    // Format: "Label : Value" or "Label: Value"
    const colonIdx = text.indexOf(':');
    if (colonIdx === -1) return;

    const label = text.slice(0, colonIdx).trim().replace(/[\u200e\u200f]/g, ''); // strip RTL marks
    const value = text.slice(colonIdx + 1).trim();

    if (!label || !value) return;

    const key = normalizeKey(label);
    if (!key || SKIP_KEYS.has(label.toLowerCase())) return;
    if (value.length > 200) return; // skip overly long values (probably prose)

    attrs.push({ key, label, value: cleanValue(value), rawValue: value });
  });

  return attrs;
}

/**
 * Parse product overview table (glance icons section).
 * Format: <tr><td>icon</td><td>Label</td><td>Value</td></tr>
 */
function parseProductOverview(): ProductAttribute[] {
  const attrs: ProductAttribute[] = [];
  const rows = document.querySelectorAll('#productOverview_feature_div tr');

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) return;

    // Usually: [icon cell, label cell, value cell] or [label cell, value cell]
    const labelCell = cells[cells.length - 2];
    const valueCell = cells[cells.length - 1];
    const label = labelCell?.textContent?.trim();
    const value = valueCell?.textContent?.trim();

    if (!label || !value || value === label) return;

    const key = normalizeKey(label);
    if (!key || SKIP_KEYS.has(label.toLowerCase())) return;

    attrs.push({ key, label, value: cleanValue(value), rawValue: value });
  });

  return attrs;
}

/**
 * Main function: extract all structured specs from the current Amazon product page.
 * Deduplicates by key — first occurrence wins (overview > table > bullets priority).
 */
export function extractStructuredSpecs(): ProductAttribute[] {
  const seen = new Set<string>();
  const all: ProductAttribute[] = [];

  const addIfNew = (attrs: ProductAttribute[]) => {
    for (const attr of attrs) {
      if (!seen.has(attr.key)) {
        seen.add(attr.key);
        all.push(attr);
      }
    }
  };

  // Priority order: overview glance icons → tech spec table → detail bullets
  addIfNew(parseProductOverview());
  addIfNew(parseTableSpecs('#productDetails_techSpec_section_1'));
  addIfNew(parseTableSpecs('#productDetails_techSpec_section_2'));
  addIfNew(parseTableSpecs('#productDetails_db_sections'));
  addIfNew(parseDetailBullets());

  return all;
}
