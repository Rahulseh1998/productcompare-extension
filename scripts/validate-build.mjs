/**
 * validate-build.mjs
 *
 * Runs after `npm run build` and checks that every file referenced in
 * dist/manifest.json actually exists in dist/. Catches path mismatches
 * (like the sidepanel HTML being in the wrong directory) before you ever
 * try loading the extension in Chrome.
 *
 * Usage:  node scripts/validate-build.mjs
 * CI:     add to build script → "build": "vite build && node scripts/validate-build.mjs"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

// ── Load manifest ─────────────────────────────────────────────────────────────

const manifestPath = path.join(DIST, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  fatal('dist/manifest.json not found — did you run npm run build?');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// ── Collect all file references from the manifest ────────────────────────────

const refs = [];

// Background service worker
if (manifest.background?.service_worker) {
  refs.push({ field: 'background.service_worker', file: manifest.background.service_worker });
}

// Side panel
if (manifest.side_panel?.default_path) {
  refs.push({ field: 'side_panel.default_path', file: manifest.side_panel.default_path });
}

// Action popup
if (manifest.action?.default_popup) {
  refs.push({ field: 'action.default_popup', file: manifest.action.default_popup });
}

// Content scripts
(manifest.content_scripts ?? []).forEach((cs, i) => {
  (cs.js ?? []).forEach(f => refs.push({ field: `content_scripts[${i}].js`, file: f }));
  (cs.css ?? []).forEach(f => refs.push({ field: `content_scripts[${i}].css`, file: f }));
});

// Web accessible resources
(manifest.web_accessible_resources ?? []).forEach((entry, i) => {
  (entry.resources ?? []).forEach(f => {
    // Skip glob patterns — can't check these statically
    if (f.includes('*')) return;
    refs.push({ field: `web_accessible_resources[${i}]`, file: f });
  });
});

// Icons
const iconSizes = Object.values(manifest.icons ?? {});
iconSizes.forEach(f => refs.push({ field: 'icons', file: f }));

// Action icons
const actionIconSizes = Object.values(manifest.action?.default_icon ?? {});
actionIconSizes.forEach(f => refs.push({ field: 'action.default_icon', file: f }));

// ── Check each reference exists ───────────────────────────────────────────────

let errors = 0;
let warnings = 0;

console.log(`\nValidating ${refs.length} manifest file references against dist/...\n`);

for (const { field, file } of refs) {
  const fullPath = path.join(DIST, file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓  ${file}  (${field})`);
  } else {
    // Icons are placeholders during development — warn, don't fail
    if (field === 'icons' || field === 'action.default_icon') {
      console.warn(`  ⚠  ${file}  (${field}) — MISSING (add before CWS submission)`);
      warnings++;
    } else {
      console.error(`  ✗  ${file}  (${field}) — FILE NOT FOUND`);
      errors++;
    }
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
if (errors === 0 && warnings === 0) {
  console.log('✓ All manifest references exist in dist/. Safe to load in Chrome.\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠ Build valid (${warnings} warning${warnings > 1 ? 's' : ''} — non-blocking).\n`);
  process.exit(0);
} else {
  console.error(`\n✗ ${errors} critical error${errors > 1 ? 's' : ''} — extension WILL FAIL to load in Chrome.\n`);
  process.exit(1);
}

function fatal(msg) {
  console.error(`\nFATAL: ${msg}\n`);
  process.exit(1);
}
