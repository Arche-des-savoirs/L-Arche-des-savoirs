import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { yamlPlugin } from './scripts/vite-yaml';

// Publié sur https://arche-des-savoirs.github.io/L-Arche-des-savoirs/
const base = '/L-Arche-des-savoirs/';

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  plugins: [
    yamlPlugin(),
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: "L'Arche des Savoirs",
        short_name: 'Arche',
        description: 'Jeu narratif ludo-éducatif pour trois apprenties archivistes.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        background_color: '#1a2145',
        theme_color: '#1a2145',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,json,woff2,ogg}'],
        // Les voix pré-générées (Chirp3-HD) sont nombreuses et parfois > le seuil par défaut (2 Mo) ; 5 Mo couvre large.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts']
  }
});
