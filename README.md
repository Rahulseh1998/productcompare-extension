# ProductCompare for Amazon

> Stop switching tabs. Compare Amazon products side-by-side in one click.

A state-of-the-art Chrome Extension (Manifest V3) that injects a comparison workflow directly into Amazon product pages — floating compare bar, side-panel comparison table with AI-powered extraction and verdicts, and price history charts.

**Target: 100k Chrome Web Store downloads**

---

## What It Does

1. Visit any Amazon product page → click **"Add to Compare"**
2. Add 2–5 products from any category
3. Click **"Compare Now"** → side panel opens with a full attribute table
4. Differences highlighted green/red, identical rows dimmed
5. AI verdict: Best Value / Best Specs / Best Rated (Pro)
6. 90-day price history chart per product (Pro)
7. Export as image or share via link

---

## Architecture Highlights

- **LLM-based extraction** (not brittle DOM selectors) — extract text from stable section containers, pass to Claude Haiku for semantic attribute parsing. Works for laptops, supplements, clothing, tools — any category, without per-category config.
- **Shadow DOM injection** — all content script UI uses Shadow DOM for CSS isolation from Amazon's aggressive styles
- **Chrome Side Panel API** — comparison view persists across page navigation within the tab
- **ASIN-based caching** — LLM extraction results cached 24hrs, eliminating repeat API calls

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Extension | Chrome MV3 | Required for CWS, Side Panel API |
| UI | React + TypeScript | Component reuse across side panel, popup, content script |
| Build | Vite multi-entry | Fast builds, proper MV3 bundling |
| Styles | Tailwind (pc- prefix) | No Amazon CSS collisions |
| State | Zustand | No Provider boilerplate, works in all extension contexts |
| LLM | Claude Haiku | Cheap (~$0.0006/extraction), fast, category-agnostic |
| Charts | Recharts | Lightweight, tree-shakeable |
| Tests | Vitest + Playwright | Unit + real extension E2E |

---

## Monetization

| Tier | Price | Products | Features |
|------|-------|----------|---------|
| Free | $0 | 3 | Basic comparison table |
| Pro Monthly | $2.99/mo | 5 | + AI verdict, price history, export, saved comparisons |
| Pro Annual | $19.99/yr | 5 | Same, "Save 44%" |
| Pro Lifetime | $49.99 | 5 | Same, one-time |

---

## Project Structure & Issues

See the [Master Project Tracker](../../issues/11) for the full execution order and parallelism guide.

| Milestone | Issues |
|-----------|--------|
| v1.0 - MVP | #1 Setup, #2 Extraction, #3 Content UI, #4 Side Panel, #5 Background |
| v1.1 - Monetization | #6 License & Stripe |
| v1.2 - AI + History | #7 AI Verdict, #8 Price History |
| v1.3 - Growth | #9 Export/Sharing, #10 Onboarding/CWS |

---

## Getting Started

```bash
npm install
npm run dev      # watch mode
npm run build    # production build → dist/
npm test         # unit tests
npm run test:e2e # Playwright E2E (loads real extension)
```

Load `dist/` in `chrome://extensions` with Developer Mode on.

---

## Privacy

- Content script reads only the currently open Amazon page
- No product data or browsing history leaves the browser
- Only network calls: Anthropic API (product specs, no PII) + Keepa API (ASIN only) + Stripe (external payment site)
