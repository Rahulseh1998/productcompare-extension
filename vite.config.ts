import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

// Root is src/ so HTML entry paths are relative to src/ and
// the dist output structure matches the manifest's file references exactly:
//   dist/sidepanel/index.html  ← manifest "side_panel.default_path"
//   dist/popup/index.html      ← manifest "action.default_popup"
//   dist/background/index.js   ← manifest "background.service_worker"
//   dist/content/index.js      ← manifest "content_scripts[].js"

export default defineConfig({
  root: resolve(__dirname, 'src'),
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      // Paths relative to root (src/)
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
        // TS entries use absolute paths — unaffected by root
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        // HTML entries are relative to root (src/) — outputs to dist/sidepanel/index.html
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: (chunk) => `${chunk.name}/index.js`,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (asset) => {
          if (asset.name?.endsWith('.css')) return 'content/content.css';
          return 'assets/[name][extname]';
        },
      },
    },
    modulePreload: { polyfill: false },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
