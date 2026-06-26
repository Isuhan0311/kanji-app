import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Native (Capacitor) builds skip the PWA service worker: assets are served
// from a local origin inside the WebView, so the SW is unneeded and its
// caching/update logic only causes conflicts.
const isCapBuild = !!process.env.CAP_BUILD;

export default defineConfig({
  base: '/kanji-app/',
  plugins: [
    react(),
    ...(isCapBuild ? [] : [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: '한자 학습',
        short_name: '한자',
        lang: 'ko',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0f6e56',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    })]),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
