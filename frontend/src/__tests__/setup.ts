/**
 * Vitest グローバルセットアップ
 *
 * テスト実行前に共通の設定やモックを適用する
 */

import { afterEach, vi } from 'vitest'

// 環境変数のモック
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
vi.stubEnv('AUTH_SECRET', 'test-secret-key-for-testing')
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
vi.stubEnv('LINE_CLIENT_ID', 'test-line-client-id')
vi.stubEnv('LINE_CLIENT_SECRET', 'test-line-client-secret')

// グローバルのクリーンアップ
afterEach(() => {
  vi.clearAllMocks()
})
