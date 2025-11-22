import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'path'

/**
 * Node.js環境用のVitest設定
 * DB操作などNode.js固有の機能を使うテスト用
 *
 * 環境変数は @/libs/constants/env.ts 経由で読み込まれるため、
 * ここでは .env.local を process.env に展開するのみ
 */
export default defineConfig(({ mode }) => {
  // .env.local を読み込んで process.env に設定
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }

  return {
    test: {
      // グローバル設定
      globals: true,

      // テストファイルのパターン（DB操作テストとAPI統合テスト）
      include: [
        '__tests__/integration/services/**/*.test.ts',
        '__tests__/integration/api/**/*.test.ts'
      ],

      // Node.js環境（jsdom不要）
      environment: 'node',

      // タイムアウト設定（DB操作は時間がかかる場合がある）
      testTimeout: 30000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@tests': path.resolve(__dirname, './__tests__'),
      },
    },
  }
})
