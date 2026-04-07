import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Content script build — IIFE format, everything inlined.
 *
 * Content scripts are injected into third-party pages (Amazon) as plain <script> tags.
 * Chrome does NOT support ES module imports in content scripts — any `import` statement
 * will throw "Cannot use import statement outside a module".
 *
 * Solution: build as IIFE (Immediately Invoked Function Expression).
 * All dependencies (React, etc.) are bundled into a single self-contained file.
 * No external chunk imports, no dynamic imports — just one flat JS file.
 *
 * Trade-off: dist/content/index.js is larger (~200KB) because React is inlined.
 * This is the correct and standard approach for content scripts.
 */
export default defineConfig({
  root: resolve(__dirname, 'src'),
  plugins: [react()],
  define: {
    // React needs NODE_ENV to tree-shake dev warnings
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'chrome114',
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false, // don't wipe the main build output
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'PC', // IIFE global name (unused externally but required)
      formats: ['iife'],
      fileName: () => 'content/index.js',
    },
    rollupOptions: {
      output: {
        // Inline every import — no chunk splitting for content scripts
        inlineDynamicImports: true,
      },
    },
    // Minify for smaller payload injected into every Amazon page
    minify: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
