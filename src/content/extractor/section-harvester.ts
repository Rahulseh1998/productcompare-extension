import { SELECTORS } from './selectors';

export interface HarvestedSections {
  title: string;
  brand: string;
  bullets: string;
  techSpecs: string;
  detailBullets: string;
  description: string;
  aplus: string;
  overview: string;
}

/** Extract clean text content from a selector, empty string if not found */
function getText(selector: string): string {
  const el = document.querySelector(selector);
  if (!el) return '';
  return el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Try multiple selectors, return first non-empty result */
function getTextAny(selectors: readonly string[]): string {
  for (const sel of selectors) {
    const text = getText(sel);
    if (text) return text;
  }
  return '';
}

/**
 * Harvest raw text from all major Amazon product page sections.
 * These are stable CONTAINER selectors — the LLM handles understanding the content.
 *
 * We include section labels ([BULLETS], [SPECS] etc.) so the LLM has context
 * about where each piece of text came from.
 */
export function harvestSections(): HarvestedSections {
  return {
    title: getTextAny(SELECTORS.TITLE),
    brand: getTextAny(SELECTORS.BRAND),
    bullets: getText(SELECTORS.BULLET_POINTS),
    techSpecs: [
      getText(SELECTORS.TECH_SPEC_TABLE_1),
      getText(SELECTORS.TECH_SPEC_TABLE_2),
    ].filter(Boolean).join('\n'),
    detailBullets: getText(SELECTORS.DETAIL_BULLETS),
    description: getText(SELECTORS.PRODUCT_DESCRIPTION),
    aplus: getText(SELECTORS.APLUS_CONTENT),
    overview: getText(SELECTORS.PRODUCT_OVERVIEW),
  };
}

/** Build a structured text string from harvested sections for the LLM prompt */
export function buildPageText(sections: HarvestedSections): string {
  const parts: string[] = [];

  if (sections.title) parts.push(`[TITLE]\n${sections.title}`);
  if (sections.brand) parts.push(`[BRAND]\n${sections.brand}`);
  if (sections.bullets) parts.push(`[BULLETS]\n${sections.bullets}`);
  if (sections.overview) parts.push(`[OVERVIEW]\n${sections.overview}`);
  if (sections.techSpecs) parts.push(`[SPECS]\n${sections.techSpecs}`);
  if (sections.detailBullets) parts.push(`[DETAILS]\n${sections.detailBullets}`);
  if (sections.description) parts.push(`[DESCRIPTION]\n${sections.description.slice(0, 800)}`);
  if (sections.aplus) parts.push(`[ADDITIONAL]\n${sections.aplus.slice(0, 500)}`);

  return parts.join('\n\n');
}
