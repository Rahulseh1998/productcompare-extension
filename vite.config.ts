import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: 'src/manifest.json', dest: '.' },
        { src: 'src/icons', dest: '.' },
      ],
    }),
  ],
  build: {
    target: 'chrome114',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        // Fixed filenames — manifest.json references these directly
        entryFileNames: (chunk) => `${chunk.name}/index.js`,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (asset) => {
          if (asset.name?.endsWith('.css')) return 'content/content.css';
          return 'assets/[name][extname]';
        },
      },
    },
    // Content scripts cannot use dynamic import (MV3 restriction)
    modulePreload: { polyfill: false },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
