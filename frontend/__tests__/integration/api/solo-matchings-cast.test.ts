/**
 * /api/solo-matchings/cast API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * API エンドポイントのバリデーション、認証、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアとサービス層をモックする
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCastSoloMatchingsApp } from '@/app/api/solo-matchings/cast/[[...route]]/route'
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
    getCastSoloMatchings: vi.fn(),
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
  const { app } = createCastSoloMatchingsApp({
    authMiddleware: createMockAuthMiddleware(token),
    verifyAuthMiddleware: noopVerifyAuth,
  })
  return app
}

// テスト用のモックデータ
const mockMatching: SoloMatching = {
  id: 'matching-1',
  guestId: 'guest-1',
  castId: 'cast-1',
  chatRoomId: null,
  status: 'pending',
  proposedDate: new Date('2024-12-01T18:00:00Z'),
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
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('GET /api/solo-matchings/cast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('未認証の場合は401エラーを返す', async () => {
      const app = createTestApp() // token なし

      const response = await app.request('/api/solo-matchings/cast', {
        method: 'GET',
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
      expect(mockUserService.findUserById).not.toHaveBeenCalled()
      expect(mockSoloMatchingService.getCastSoloMatchings).not.toHaveBeenCalled()
    })

    it('ユーザーIDが無効な場合は401エラーを返す', async () => {
      const app = createTestApp({ id: undefined })

      const response = await app.request('/api/solo-matchings/cast', {
        method: 'GET',
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
      expect(mockUserService.findUserById).not.toHaveBeenCalled()
    })

    it('ユーザーが存在しない場合は404エラーを返す', async () => {
      const app = createTestApp({ id: 'cast-1' })
      // vitest mockの型定義がnullを正しく扱えないため、型アサーションを使用
      mockUserService.findUserById.mockImplementation(
        // @ts-expect-error - 戻り値の型がPromise<User | null>だが、mockの型定義がnullを許容していない
        async (): Promise<User | null> => null
      )

      const response = await app.request('/api/solo-matchings/cast', {
        method: 'GET',
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('ユーザーが見つかりません')
      expect(mockUserService.findUserById).toHaveBeenCalledWith('cast-1')
    })
  })

  describe('ロールチェック', () => {
    it('ゲストの場合は403エラーを返す', async () => {
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

      const response = await app.request('/api/solo-matchings/cast', {
        method: 'GET',
      })

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('キャストのみマッチング一覧を取得できます')
      expect(mockSoloMatchingService.getCastSoloMatchings).not.toHaveBeenCalled()
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

      const response = await app.request('/api/solo-matchings/cast', {
        method: 'GET',
      })

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('キャストのみマッチング一覧を取得できます')
    })
  })

  describe('正常系', () => {
    it('キャストがマッチング一覧を取得できる', async () => {
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
      mockSoloMatchingService.getCastSoloMatchings.mockResolvedValue([mockMatching])

      const response = await app.request('/api/solo-matchings/cast', {
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
      expect(mockSoloMatchingService.getCastSoloMatchings).toHaveBeenCalledWith('cast-1')
    })

    it('マッチングが0件の場合は空配列を返す', async () => {
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
      mockSoloMatchingService.getCastSoloMatchings.mockResolvedValue([])

      const response = await app.request('/api/solo-matchings/cast', {
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
      mockSoloMatchingService.getCastSoloMatchings.mockRejectedValue(
        new Error('Database error')
      )

      const response = await app.request('/api/solo-matchings/cast', {
        method: 'GET',
      })

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('予期しないエラーが発生しました')
    })
  })
})
