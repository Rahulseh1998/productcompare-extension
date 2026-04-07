import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

/**
 * Main build: background service worker, side panel, popup.
 * These run as ES modules (background has "type":"module" in manifest;
 * sidepanel/popup load via <script type="module"> in their HTML files).
 * Code splitting is fine here — they can import from chunks.
 */
export default defineConfig({
  root: resolve(__dirname, 'src'),
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'icons', dest: '.' },
      ],
    }),
  ],
  build: {
    target: 'chrome114',
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        // Content script is built separately (see vite.content.config.ts)
        // because content scripts cannot use ES module imports.
      },
      output: {
        entryFileNames: (chunk) => `${chunk.name}/index.js`,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
    modulePreload: { polyfill: false },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
