import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    // ブラウザ環境で process.env を使用可能にする
    'process.env': {},
  },
  optimizeDeps: {
    include: [
      'hono',
      'hono/http-exception',
      '@hono/zod-validator',
      'zod',
      'next-auth/react',
      'react',
      'react-dom',
      '@tanstack/react-query',
      'next/link',
    ],
  },
  test: {
    // グローバル設定
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],

    // テストファイルのパターン
    // DB操作テストはNode.js環境で実行するため除外
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '__tests__/e2e/**/*',
      '__tests__/integration/services/**/*.test.ts'
    ],

    // Browser Mode 設定
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      // CI では headless モード
      headless: !!process.env.CI,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './__tests__'),
    },
  },
})
