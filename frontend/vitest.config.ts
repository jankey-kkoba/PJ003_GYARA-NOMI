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
  test: {
    // グローバル設定
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],

    // テストファイルのパターン
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/__tests__/e2e/**/*'],

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
    },
  },
})
