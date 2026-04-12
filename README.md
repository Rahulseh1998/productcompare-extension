# ProductCompare for Amazon

**Stop switching tabs. Compare in one click.**

A Chrome extension that lets you compare Amazon products side-by-side with AI-powered attribute extraction and intelligent diffing — right on the product page.

## Features (v1.0 MVP)

- **Honey-style Add to Compare widget** — floating button on every Amazon product page
- **Floating Compare Bar** — persistent bottom bar showing added products with product chips
- **Side Panel Comparison Table** — full attribute-by-attribute diff with green/red highlighting
- **Two-tier extraction**:
  - Tier 1: Structured spec parsing (instant, no API key needed) — reads Amazon's spec tables, detail bullets, product overview
  - Tier 2: LLM enrichment (optional) — Claude Haiku extracts additional attributes from page text
- **Key normalization & dedup** — collapses near-duplicate attributes ("Is Dishwasher Safe" ↔ "Dishwasher Safe")
- **Cross-category detection** — soft warning when comparing products from different categories
- **CSV Export** — one-click export of comparison table
- **SPA navigation support** — re-injects on Amazon's client-side page changes

## Getting Started

### Prerequisites
- Node.js 18+
- Chrome 114+ (for Side Panel API)

### Build & Load

```bash
npm install
npm run build
```

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder
4. Navigate to any Amazon product page

### Optional: Enable AI Enrichment

1. Click the extension popup → Settings (gear icon)
2. Enter your Anthropic API key (`sk-ant-...`)
3. Attributes will be enriched via Claude Haiku on the next product add

## Architecture

```
Content Script (IIFE)          Background Service Worker         Side Panel (React)
├── Extraction pipeline         ├── Message router                ├── ComparisonTable
│   ├── ASIN (4 strategies)     ├── Storage (chrome.storage)      ├── AttributeRow (diff)
│   ├── Price (4 strategies)    ├── LLM extraction trigger        ├── Export CSV
│   ├── Structured specs        ├── Claude verdict generator      └── Mixed-category warning
│   └── Page text harvester     └── License checker
├── FloatingAddWidget
└── FloatingCompareBar
```

### Build System

Two-build Vite setup for MV3 compliance:
- **Main build**: ES modules for background, side panel, popup (code-split with shared chunks)
- **Content script build**: IIFE format, all dependencies inlined (~205KB)
- **Build validation**: `scripts/validate-build.mjs` checks all manifest file references exist in `dist/`

## Project Structure

```
src/
├── background/         # Service worker, message routing, LLM clients
├── content/            # Content script, extraction pipeline, UI injection
│   └── extractor/      # ASIN, price, specs, section harvester
├── components/         # FloatingAddWidget, FloatingCompareBar
├── sidepanel/          # Comparison table UI
├── popup/              # Extension popup with settings
├── store/              # Zustand store
├── types/              # Product, ComparedRow, ExtensionMessage, etc.
└── utils/              # Diff algorithm, key normalization, CSV export, category detection
```

## Roadmap

- [x] v1.0 MVP — Core extraction, comparison table, floating UI
- [x] v1.1 Monetization — License keys, Pro gating, activation UI
- [x] v1.2 AI + Price History — Claude verdict, price history chart (Pro-gated)
- [ ] v1.3 Growth — Onboarding, shareable links, image export, CWS listing

## Tech Stack

- **TypeScript** / **React 19** / **Zustand** — UI and state
- **Vite** — multi-entry build with IIFE content script
- **Chrome MV3** — Side Panel API, service worker, content scripts
- **Claude Haiku 4.5** — LLM attribute extraction and comparison verdict
- **Vitest** + **Playwright** — testing

## License

Proprietary — see LICENSE file.
