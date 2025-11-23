import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2Eテスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './__tests__/e2e',

  /* テストの並列実行 */
  fullyParallel: true,

  /* CIで失敗したテストのリトライ */
  forbidOnly: !!process.env.CI,

  /* CIではリトライしない */
  retries: process.env.CI ? 2 : 0,

  /* CIではワーカー数を制限 */
  workers: process.env.CI ? 1 : undefined,

  /* テストレポーターの設定 */
  reporter: 'html',

  /* 共通の設定 */
  use: {
    /* ベースURL */
    baseURL: 'http://localhost:3000',

    /* 失敗時のスクリーンショット */
    screenshot: 'only-on-failure',

    /* トレース設定 */
    trace: 'on-first-retry',
  },

  /* テスト実行前にローカルサーバーを起動 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  /* 各ブラウザでのテスト設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* モバイルブラウザでのテスト */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
