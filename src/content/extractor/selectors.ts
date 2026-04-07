/**
 * High-level CONTAINER selectors only.
 *
 * We never select individual spec cells — that's the LLM's job.
 * These selectors target section containers whose IDs Amazon rarely renames.
 * When Amazon does break one, update it here (or via the CDN override system)
 * without a CWS re-review.
 */
export const SELECTORS = {
  // ── Direct extraction (critical fields, bypasses LLM) ──────────────────────

  TITLE: [
    '#productTitle',
    'h1.a-size-large',
    'h1[data-feature-name="title"]',
    '.product-title-word-break',
  ],

  PRICE_OFFSCREEN: '.a-price .a-offscreen',
  PRICE_WHOLE: '.a-price-whole',
  PRICE_FRACTION: '.a-price-fraction',
  PRICE_DEAL: '#priceblock_dealprice',
  PRICE_RANGE: '.a-price-range .a-offscreen',

  RATING: [
    '#acrPopover .a-icon-alt',
    'span[data-hook="rating-out-of-text"]',
    '#averageCustomerReviews .a-icon-alt',
  ],

  REVIEW_COUNT: [
    '#acrCustomerReviewText',
    'span[data-hook="total-review-count"]',
  ],

  MAIN_IMAGE: [
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    '#ebooksImgBlkFront',
  ],

  PRIME_BADGE: '#isPrimeBadge, .a-icon-prime',

  AVAILABILITY: '#availability span',

  BRAND: [
    '#bylineInfo',
    '#brand',
    'a#bylineInfo',
  ],

  ASIN_INPUT: 'input[name="ASIN"]',
  ASIN_ADD_TO_CART: '#add-to-cart-button',

  // ── Section text containers (stable IDs, used for LLM text harvest) ────────

  BULLET_POINTS: '#feature-bullets',
  TECH_SPEC_TABLE_1: '#productDetails_techSpec_section_1',
  TECH_SPEC_TABLE_2: '#productDetails_techSpec_section_2',
  ADDITIONAL_DETAILS: '#productDetails_db_sections',
  DETAIL_BULLETS: '#detailBulletsWrapper_feature_div',
  PRODUCT_DESCRIPTION: '#product-description',
  APLUS_CONTENT: '#aplus',
  PRODUCT_OVERVIEW: '#productOverview_feature_div',

  // ── Injection targets (where we insert our UI) ────────────────────────────

  BUY_BOX: ['#rightCol', '#desktop_buybox', '#buyBoxInner'],
  TITLE_BLOCK: '#titleSection, #title',
} as const;
