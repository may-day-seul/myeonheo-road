import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 자동 갱신은 새 버전이 뜨는 순간 페이지를 새로고침한다.
      // 40분짜리 모의고사 도중에 그러면 답안이 날아가므로 사용자가 고르게 한다.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '오늘도 딴다 — 2종보통 학과시험',
        short_name: '오늘도 딴다',
        description:
          '도로교통공단 학과시험 문제은행 1,000문항으로 하루 10문항씩 학습하는 앱',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0D12',
        theme_color: '#0B0D12',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 첫 방문에도 서비스워커가 바로 페이지를 맡게 한다. 이게 없으면 한 번
        // 새로고침하기 전까지는 제어되지 않아, 처음 들어온 사용자가 곧바로
        // 오프라인으로 전환하면 아무것도 캐시에서 뜨지 않는다.
        // skipWaiting은 켜지 않는다 — 새 버전은 여전히 사용자가 고른 시점에 적용된다.
        clientsClaim: true,
        // 앱 셸과 문제은행만 미리 받는다. 카드 293장(9.4MB)과 폰트 조각 92개를
        // 통째로 선캐시하면 설치가 지나치게 무거워진다 — 아래에서 본 것만 캐시한다.
        globPatterns: ['**/*.{js,css,html,webmanifest}', 'assets/bank-*.json'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/q/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'question-cards',
              expiration: { maxEntries: 320, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
