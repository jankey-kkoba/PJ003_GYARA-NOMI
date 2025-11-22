/**
 * GET /api/casts API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * キャスト一覧取得APIの認証、ロールチェック、ページネーション、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアのみをモックする
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCastsApp } from '@/app/api/casts/[[...route]]/route'
import { createMockAuthMiddleware, type MockAuthToken } from '@tests/utils/mock-auth'
import { castService } from '@/features/cast/services/castService'

// castService のモック
vi.mock('@/features/cast/services/castService', () => ({
  castService: {
    getCastList: vi.fn(),
    getCastById: vi.fn(),
  },
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
  AUTH_SECRET: 'test-secret',
  LINE_CLIENT_ID: 'test-client-id',
  LINE_CLIENT_SECRET: 'test-client-secret',
}))

// モック化された castService を取得
const mockCastService = vi.mocked(castService)

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
  const { app } = createCastsApp({
    authMiddleware: createMockAuthMiddleware(token),
    verifyAuthMiddleware: noopVerifyAuth,
  })
  return app
}

describe('GET /api/casts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
    })

    it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
      const app = createTestApp({ role: 'guest' }) // id なし

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('認証が必要です')
    })
  })

  describe('ロールチェック', () => {
    it('キャストユーザーは 403 エラーを返す', async () => {
      const app = createTestApp({ id: 'cast-user-id', role: 'cast' })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
    })

    it('管理者ユーザーは 403 エラーを返す', async () => {
      const app = createTestApp({ id: 'admin-user-id', role: 'admin' })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
    })
  })

  describe('パラメータバリデーション', () => {
    const validToken = { id: 'guest-user-id', role: 'guest' as const }

    it('page が 0 以下の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?page=0', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('page が負の数の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?page=-1', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('limit が 0 以下の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?limit=0', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('limit が 100 を超える場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?limit=101', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('page が数値でない場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?page=invalid', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('limit が数値でない場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?limit=invalid', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('minAge が 18 未満の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?minAge=17', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('maxAge が 18 未満の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?maxAge=17', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('minAge が数値でない場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

      const res = await app.request('/api/casts?minAge=invalid', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })
  })

  describe('正常系', () => {
    const validToken = { id: 'guest-user-id', role: 'guest' as const }

    it('デフォルトパラメータでキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      const mockCasts = [
        {
          id: 'cast-1',
          name: 'キャスト1',
          age: 25,
          bio: '自己紹介1',
          rank: 1,
          areaName: 'エリア1',
          thumbnailUrl: null,
        },
        {
          id: 'cast-2',
          name: 'キャスト2',
          age: 28,
          bio: '自己紹介2',
          rank: 2,
          areaName: 'エリア2',
          thumbnailUrl: null,
        },
      ]

      mockCastService.getCastList.mockResolvedValue({
        casts: mockCasts,
        total: 25,
      })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.casts).toHaveLength(2)
      expect(body.data.casts[0].name).toBe('キャスト1')
      expect(body.data.totalPages).toBe(3) // 25 / 12 = 2.08... → 3
      expect(body.data.page).toBe(1)
      expect(body.data.limit).toBe(12)
      expect(body.data.total).toBe(25)

      // castService が正しく呼ばれたか確認
      expect(mockCastService.getCastList).toHaveBeenCalledWith({ page: 1, limit: 12 })
    })

    it('カスタムパラメータでキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      const mockCasts = [
        {
          id: 'cast-3',
          name: 'キャスト3',
          age: 30,
          bio: '自己紹介3',
          rank: 3,
          areaName: 'エリア3',
          thumbnailUrl: null,
        },
      ]

      mockCastService.getCastList.mockResolvedValue({
        casts: mockCasts,
        total: 50,
      })

      const res = await app.request('/api/casts?page=2&limit=20', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.casts).toHaveLength(1)
      expect(body.data.totalPages).toBe(3) // 50 / 20 = 2.5 → 3
      expect(body.data.page).toBe(2)
      expect(body.data.limit).toBe(20)
      expect(body.data.total).toBe(50)

      expect(mockCastService.getCastList).toHaveBeenCalledWith({ page: 2, limit: 20 })
    })

    it('キャストが0件の場合でも正常に動作する', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockResolvedValue({
        casts: [],
        total: 0,
      })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.casts).toHaveLength(0)
      expect(body.data.totalPages).toBe(0)
      expect(body.data.page).toBe(1)
      expect(body.data.total).toBe(0)
    })

    it('limitの最大値100でキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockResolvedValue({
        casts: [],
        total: 200,
      })

      const res = await app.request('/api/casts?limit=100', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.totalPages).toBe(2) // 200 / 100 = 2

      expect(mockCastService.getCastList).toHaveBeenCalledWith({ page: 1, limit: 100 })
    })

    it('limitの最小値1でキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockResolvedValue({
        casts: [
          {
            id: 'cast-1',
            name: 'キャスト1',
            age: 25,
            bio: '自己紹介1',
            rank: 1,
            areaName: 'エリア1',
            thumbnailUrl: null,
          },
        ],
        total: 100,
      })

      const res = await app.request('/api/casts?limit=1', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.totalPages).toBe(100) // 100 / 1 = 100

      expect(mockCastService.getCastList).toHaveBeenCalledWith({ page: 1, limit: 1 })
    })

    it('minAgeパラメータを指定してキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockResolvedValue({
        casts: [],
        total: 10,
      })

      const res = await app.request('/api/casts?minAge=20', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      expect(mockCastService.getCastList).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        minAge: 20,
        maxAge: undefined,
      })
    })

    it('maxAgeパラメータを指定してキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockResolvedValue({
        casts: [],
        total: 10,
      })

      const res = await app.request('/api/casts?maxAge=30', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      expect(mockCastService.getCastList).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        minAge: undefined,
        maxAge: 30,
      })
    })

    it('minAgeとmaxAgeの両方を指定してキャスト一覧を取得できる', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockResolvedValue({
        casts: [],
        total: 5,
      })

      const res = await app.request('/api/casts?minAge=20&maxAge=30', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      expect(mockCastService.getCastList).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        minAge: 20,
        maxAge: 30,
      })
    })
  })

  describe('エラーハンドリング', () => {
    const validToken = { id: 'guest-user-id', role: 'guest' as const }

    it('DB エラーが発生した場合は 500 エラーを返す', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastList.mockRejectedValue(new Error('DB connection failed'))

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('予期しないエラーが発生しました')
    })
  })
})

describe('GET /api/casts/:castId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

      const res = await app.request('/api/casts/cast-123', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
    })
  })

  describe('ロールチェック', () => {
    it('キャストユーザーは 403 エラーを返す', async () => {
      const app = createTestApp({ id: 'cast-user-id', role: 'cast' })

      const res = await app.request('/api/casts/cast-123', {
        method: 'GET',
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
    })
  })

  describe('正常系', () => {
    const validToken = { id: 'guest-user-id', role: 'guest' as const }

    it('キャスト詳細を取得できる', async () => {
      const app = createTestApp(validToken)

      const mockCast = {
        id: 'cast-123',
        name: 'テストキャスト',
        age: 25,
        bio: '自己紹介文です',
        rank: 1,
        areaName: '渋谷',
      }

      mockCastService.getCastById.mockResolvedValue(mockCast)

      const res = await app.request('/api/casts/cast-123', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.cast.id).toBe('cast-123')
      expect(body.data.cast.name).toBe('テストキャスト')
      expect(body.data.cast.age).toBe(25)

      expect(mockCastService.getCastById).toHaveBeenCalledWith('cast-123')
    })
  })

  describe('エラーハンドリング', () => {
    const validToken = { id: 'guest-user-id', role: 'guest' as const }

    it('キャストが見つからない場合は 404 エラーを返す', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastById.mockResolvedValue(null)

      const res = await app.request('/api/casts/nonexistent-id', {
        method: 'GET',
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('キャストが見つかりません')
    })

    it('DB エラーが発生した場合は 500 エラーを返す', async () => {
      const app = createTestApp(validToken)

      mockCastService.getCastById.mockRejectedValue(new Error('DB connection failed'))

      const res = await app.request('/api/casts/cast-123', {
        method: 'GET',
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('予期しないエラーが発生しました')
    })
  })
})
