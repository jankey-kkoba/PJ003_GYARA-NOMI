/**
 * /api/solo-matchings API 統合テスト
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
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import type { InferSelectModel } from 'drizzle-orm'
import { users } from '@/libs/db/schema/users'

type User = InferSelectModel<typeof users>

// サービス層のモック
vi.mock('@/features/user/services/userService', () => ({
  userService: {
    findUserById: vi.fn(),
  },
}))

vi.mock('@/features/solo-matching/services/soloMatchingService', () => ({
  soloMatchingService: {
    createSoloMatching: vi.fn(),
    getGuestSoloMatchings: vi.fn(),
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
      // ZodErrorの詳細な構造ではなく、エラーがあることのみを確認
      expect(body.error).toBeDefined()
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

/**
 * テスト用のマッチングデータ
 */
const mockMatching: SoloMatching = {
  id: 'matching-1',
  guestId: 'guest-1',
  castId: 'cast-1',
  chatRoomId: null,
  status: 'pending',
  proposedDate: new Date('2025-12-01T19:00:00Z'),
  proposedDuration: 120,
  proposedLocation: '渋谷駅周辺',
  hourlyRate: 5000,
  totalPoints: 10000,
  startedAt: null,
  scheduledEndAt: null,
  actualEndAt: null,
  extensionMinutes: 0,
  extensionPoints: 0,
  castRespondedAt: null,
  createdAt: new Date('2025-11-24T10:00:00Z'),
  updatedAt: new Date('2025-11-24T10:00:00Z'),
}

describe('GET /api/solo-matchings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('未認証の場合は401エラーを返す', async () => {
      const app = createTestApp() // token なし

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
      expect(mockUserService.findUserById).not.toHaveBeenCalled()
      expect(mockSoloMatchingService.getGuestSoloMatchings).not.toHaveBeenCalled()
    })

    it('ユーザーIDが無効な場合は401エラーを返す', async () => {
      const app = createTestApp({ id: undefined })

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
      expect(mockUserService.findUserById).not.toHaveBeenCalled()
    })

    it('ユーザーが存在しない場合は404エラーを返す', async () => {
      const app = createTestApp({ id: 'guest-1' })
      // vitest mockの型定義がnullを正しく扱えないため、型アサーションを使用
      mockUserService.findUserById.mockImplementation(
        // @ts-expect-error - 戻り値の型がPromise<User | null>だが、mockの型定義がnullを許容していない
        async (): Promise<User | null> => null
      )

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('ユーザーが見つかりません')
      expect(mockUserService.findUserById).toHaveBeenCalledWith('guest-1')
    })
  })

  describe('ロールチェック', () => {
    it('キャストの場合は403エラーを返す', async () => {
      const app = createTestApp({ id: 'cast-1' })
      mockUserService.findUserById.mockResolvedValue({
        id: 'cast-1',
        email: 'cast@example.com',
        emailVerified: null,
        password: null,
        role: 'cast',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('ゲストのみマッチング一覧を取得できます')
      expect(mockSoloMatchingService.getGuestSoloMatchings).not.toHaveBeenCalled()
    })

    it('管理者の場合は403エラーを返す', async () => {
      const app = createTestApp({ id: 'admin-1' })
      mockUserService.findUserById.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        emailVerified: null,
        password: null,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('ゲストのみマッチング一覧を取得できます')
    })
  })

  describe('正常系', () => {
    it('ゲストがマッチング一覧を取得できる', async () => {
      const app = createTestApp({ id: 'guest-1' })
      mockUserService.findUserById.mockResolvedValue({
        id: 'guest-1',
        email: 'guest@example.com',
        emailVerified: null,
        password: null,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockSoloMatchingService.getGuestSoloMatchings.mockResolvedValue([mockMatching])

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.soloMatchings).toHaveLength(1)
      expect(body.soloMatchings[0]).toMatchObject({
        id: 'matching-1',
        guestId: 'guest-1',
        castId: 'cast-1',
        status: 'pending',
        proposedLocation: '渋谷駅周辺',
        totalPoints: 10000,
      })
      expect(mockSoloMatchingService.getGuestSoloMatchings).toHaveBeenCalledWith('guest-1')
    })

    it('マッチングが0件の場合は空配列を返す', async () => {
      const app = createTestApp({ id: 'guest-1' })
      mockUserService.findUserById.mockResolvedValue({
        id: 'guest-1',
        email: 'guest@example.com',
        emailVerified: null,
        password: null,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockSoloMatchingService.getGuestSoloMatchings.mockResolvedValue([])

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.soloMatchings).toEqual([])
    })
  })

  describe('エラーハンドリング', () => {
    it('サービス層でエラーが発生した場合は500エラーを返す', async () => {
      const app = createTestApp({ id: 'guest-1' })
      mockUserService.findUserById.mockResolvedValue({
        id: 'guest-1',
        email: 'guest@example.com',
        emailVerified: null,
        password: null,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockSoloMatchingService.getGuestSoloMatchings.mockRejectedValue(
        new Error('Database error')
      )

      const response = await app.request('/api/solo-matchings', {
        method: 'GET',
      })

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('予期しないエラーが発生しました')
    })
  })
})
