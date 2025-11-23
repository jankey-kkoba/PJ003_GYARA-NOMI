/**
 * POST /api/solo-matchings API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * API エンドポイントのバリデーション、認証、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアとサービス層をモックする
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSoloMatchingsApp } from '@/app/api/solo-matchings/[[...route]]/route'
import { createMockAuthMiddleware, type MockAuthToken } from '@tests/utils/mock-auth'
import { userService } from '@/features/user/services/userService'
import { soloMatchingService } from '@/features/solo-matching/services/soloMatchingService'

// サービス層のモック
vi.mock('@/features/user/services/userService', () => ({
  userService: {
    findUserById: vi.fn(),
  },
}))

vi.mock('@/features/solo-matching/services/soloMatchingService', () => ({
  soloMatchingService: {
    createSoloMatching: vi.fn(),
  },
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
  AUTH_SECRET: 'test-secret',
  LINE_CLIENT_ID: 'test-client-id',
  LINE_CLIENT_SECRET: 'test-client-secret',
}))

// モック化されたサービスを取得
const mockUserService = vi.mocked(userService)
const mockSoloMatchingService = vi.mocked(soloMatchingService)

/**
 * テスト用の認証検証ミドルウェア（何もしない）
 */
const noopVerifyAuth = async (_c: unknown, next: () => Promise<void>) => {
  await next()
}

/**
 * テスト用アプリを作成
 * 実際の API コードを使用し、認証ミドルウェアのみをモック
 */
function createTestApp(token?: MockAuthToken) {
  const { app } = createSoloMatchingsApp({
    authMiddleware: createMockAuthMiddleware(token),
    verifyAuthMiddleware: noopVerifyAuth,
  })
  return app
}

describe('POST /api/solo-matchings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

      const res = await app.request('/api/solo-matchings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castId: 'cast-123',
          proposedDate: new Date(Date.now() + 86400000).toISOString(),
          proposedDuration: 120,
          proposedLocation: '渋谷',
          hourlyRate: 3000,
        }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
    })

    it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
      const app = createTestApp({ role: 'guest' }) // id なし

      const res = await app.request('/api/solo-matchings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castId: 'cast-123',
          proposedDate: new Date(Date.now() + 86400000).toISOString(),
          proposedDuration: 120,
          proposedLocation: '渋谷',
          hourlyRate: 3000,
        }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
    })
  })

  describe('ロールチェック', () => {
    it('キャストがマッチングオファーを送信しようとした場合は 403 エラーを返す', async () => {
      const app = createTestApp({ id: 'user-123', role: 'cast' })

      // ユーザー情報を返すようにモック
      mockUserService.findUserById.mockResolvedValue({
        id: 'user-123',
        email: 'cast@example.com',
        emailVerified: null,
        password: null,
        role: 'cast',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request('/api/solo-matchings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castId: 'cast-456',
          proposedDate: new Date(Date.now() + 86400000).toISOString(),
          proposedDuration: 120,
          proposedLocation: '渋谷',
          hourlyRate: 3000,
        }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('ゲストのみマッチングオファーを送信できます')
    })
  })

  describe('バリデーション', () => {
    it('過去の日時を指定した場合は 400 エラーを返す', async () => {
      const app = createTestApp({ id: 'user-123', role: 'guest' })

      mockUserService.findUserById.mockResolvedValue({
        id: 'user-123',
        email: 'guest@example.com',
        emailVerified: null,
        password: null,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request('/api/solo-matchings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castId: 'cast-123',
          proposedDate: new Date(Date.now() - 86400000).toISOString(), // 過去の日時
          proposedDuration: 120,
          proposedLocation: '渋谷',
          hourlyRate: 3000,
        }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('過去の日時は指定できません')
    })

    it('必須項目が不足している場合は 400 エラーを返す', async () => {
      const app = createTestApp({ id: 'user-123', role: 'guest' })

      mockUserService.findUserById.mockResolvedValue({
        id: 'user-123',
        email: 'guest@example.com',
        emailVerified: null,
        password: null,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await app.request('/api/solo-matchings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castId: '', // 空文字
          proposedDate: new Date(Date.now() + 86400000).toISOString(),
          proposedDuration: 120,
          proposedLocation: '渋谷',
          hourlyRate: 3000,
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('正常系', () => {
    it('ゲストがマッチングオファーを送信できる', async () => {
      const app = createTestApp({ id: 'guest-123', role: 'guest' })

      mockUserService.findUserById.mockResolvedValue({
        id: 'guest-123',
        email: 'guest@example.com',
        emailVerified: null,
        password: null,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const mockSoloMatching = {
        id: 'matching-123',
        guestId: 'guest-123',
        castId: 'cast-123',
        chatRoomId: null,
        status: 'pending' as const,
        proposedDate: new Date(Date.now() + 86400000),
        proposedDuration: 120,
        proposedLocation: '渋谷',
        hourlyRate: 3000,
        totalPoints: 6000,
        startedAt: null,
        scheduledEndAt: null,
        actualEndAt: null,
        extensionMinutes: 0,
        extensionPoints: 0,
        castRespondedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSoloMatchingService.createSoloMatching.mockResolvedValue(mockSoloMatching)

      const res = await app.request('/api/solo-matchings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castId: 'cast-123',
          proposedDate: new Date(Date.now() + 86400000).toISOString(),
          proposedDuration: 120,
          proposedLocation: '渋谷',
          hourlyRate: 3000,
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.soloMatching).toBeDefined()
      expect(body.soloMatching.guestId).toBe('guest-123')
      expect(body.soloMatching.castId).toBe('cast-123')
      expect(body.soloMatching.totalPoints).toBe(6000)
    })
  })
})
