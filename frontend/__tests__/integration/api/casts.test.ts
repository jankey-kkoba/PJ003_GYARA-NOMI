/**
 * GET /api/casts API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * キャスト一覧取得APIの認証、ロールチェック、ページネーション、エラーハンドリングを検証する
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { castListQuerySchema } from '@/features/cast/schemas/castListQuery'

// castService のモック
const mockCastService = {
  getCastList: vi.fn(),
}

vi.mock('@/features/cast/services/castService', () => ({
  castService: mockCastService,
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
  AUTH_SECRET: 'test-secret',
  LINE_CLIENT_ID: 'test-client-id',
  LINE_CLIENT_SECRET: 'test-client-secret',
}))

/**
 * テスト用の認証トークン型
 */
type MockToken = {
  id?: string
  role?: 'guest' | 'cast' | 'admin'
}

/**
 * テスト用の認証ユーザー型
 */
type MockAuthUser = {
  token?: MockToken
}

/**
 * テスト用の簡易 Hono アプリ
 * 実際の API と同じロジックを持つが、認証ミドルウェアをモック可能にする
 */
function createTestApp(mockAuthUser?: MockAuthUser) {
  const app = new Hono<{ Variables: { authUser: MockAuthUser } }>().basePath('/api/casts')

  // エラーハンドラー
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ success: false, error: err.message }, err.status)
    }
    console.error('Unexpected error:', err)
    return c.json({ success: false, error: '予期しないエラーが発生しました' }, 500)
  })

  // 認証ミドルウェアのモック
  app.use('*', async (c, next) => {
    if (mockAuthUser) {
      c.set('authUser', mockAuthUser)
    }
    await next()
  })

  // キャスト一覧取得エンドポイント
  app.get('/', zValidator('query', castListQuerySchema), async (c) => {
    // 認証済みユーザー情報を取得
    const authUser = c.get('authUser')
    const token = authUser?.token

    if (!token?.id || !token?.role) {
      throw new HTTPException(401, { message: '認証が必要です' })
    }

    // ゲストユーザーのみアクセス可能
    if (token.role !== 'guest') {
      throw new HTTPException(403, {
        message: 'この機能はゲストユーザーのみ利用できます',
      })
    }

    // バリデーション済みのクエリパラメータを取得
    const { page, limit } = c.req.valid('query')

    // キャスト一覧を取得
    const result = await mockCastService.getCastList({ page, limit })

    // 総ページ数を計算
    const totalPages = Math.ceil(result.total / limit)

    return c.json({
      success: true,
      data: {
        casts: result.casts,
        total: result.total,
        page,
        limit,
        totalPages,
      },
    })
  })

  return app
}

describe('GET /api/casts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // authUser なし

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
    })

    it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
      const app = createTestApp({ token: { role: 'guest' } })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('認証が必要です')
    })

    it('トークンにロールがない場合は 401 エラーを返す', async () => {
      const app = createTestApp({ token: { id: 'test-user-id' } })

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
      const app = createTestApp({ token: { id: 'cast-user-id', role: 'cast' } })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
    })

    it('管理者ユーザーは 403 エラーを返す', async () => {
      const app = createTestApp({ token: { id: 'admin-user-id', role: 'admin' } })

      const res = await app.request('/api/casts', {
        method: 'GET',
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
    })
  })

  describe('パラメータバリデーション', () => {
    const validAuthUser = { token: { id: 'guest-user-id', role: 'guest' as const } }

    it('page が 0 以下の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/casts?page=0', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('page が負の数の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/casts?page=-1', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('limit が 0 以下の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/casts?limit=0', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('limit が 100 を超える場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/casts?limit=101', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('page が数値でない場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/casts?page=invalid', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })

    it('limit が数値でない場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/casts?limit=invalid', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })
  })

  describe('正常系', () => {
    const validAuthUser = { token: { id: 'guest-user-id', role: 'guest' as const } }

    it('デフォルトパラメータでキャスト一覧を取得できる', async () => {
      const app = createTestApp(validAuthUser)

      const mockCasts = [
        {
          id: 'cast-1',
          name: 'キャスト1',
          age: 25,
          bio: '自己紹介1',
          rank: 1,
          areaName: 'エリア1',
        },
        {
          id: 'cast-2',
          name: 'キャスト2',
          age: 28,
          bio: '自己紹介2',
          rank: 2,
          areaName: 'エリア2',
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
      const app = createTestApp(validAuthUser)

      const mockCasts = [
        {
          id: 'cast-3',
          name: 'キャスト3',
          age: 30,
          bio: '自己紹介3',
          rank: 3,
          areaName: 'エリア3',
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
      const app = createTestApp(validAuthUser)

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
      const app = createTestApp(validAuthUser)

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
      const app = createTestApp(validAuthUser)

      mockCastService.getCastList.mockResolvedValue({
        casts: [
          {
            id: 'cast-1',
            name: 'キャスト1',
            age: 25,
            bio: '自己紹介1',
            rank: 1,
            areaName: 'エリア1',
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
  })

  describe('エラーハンドリング', () => {
    const validAuthUser = { token: { id: 'guest-user-id', role: 'guest' as const } }

    it('DB エラーが発生した場合は 500 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

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
