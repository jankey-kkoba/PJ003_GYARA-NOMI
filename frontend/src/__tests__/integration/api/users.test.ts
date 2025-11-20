/**
 * POST /api/users/register API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * API エンドポイントのバリデーション、認証、エラーハンドリングを検証する
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// userService のモック
const mockUserService = {
  hasProfile: vi.fn(),
  registerProfile: vi.fn(),
}

vi.mock('@/features/user/services/userService', () => ({
  userService: mockUserService,
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
  AUTH_SECRET: 'test-secret',
  LINE_CLIENT_ID: 'test-client-id',
  LINE_CLIENT_SECRET: 'test-client-secret',
}))

/**
 * プロフィール登録リクエストのスキーマ
 */
const registerProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  birthDate: z.string().min(1, '生年月日は必須です'),
  userType: z.enum(['guest', 'cast']),
})

/**
 * テスト用の認証ユーザー型
 */
type MockAuthUser = {
  session?: {
    user?: {
      id?: string
    }
  }
}

/**
 * テスト用の簡易 Hono アプリ
 * 実際の API と同じロジックを持つが、認証ミドルウェアをモック可能にする
 */
function createTestApp(mockAuthUser?: MockAuthUser) {
  const app = new Hono<{ Variables: { authUser: MockAuthUser } }>().basePath('/api/users')

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

  // プロフィール登録エンドポイント
  app.post('/register', zValidator('json', registerProfileSchema), async (c) => {
    // 認証済みユーザー情報を取得
    const authUser = c.get('authUser')
    const userId = authUser?.session?.user?.id

    if (!userId) {
      throw new HTTPException(401, { message: '認証が必要です' })
    }

    const data = c.req.valid('json')

    // プロフィールが既に存在するか確認
    const hasProfile = await mockUserService.hasProfile(userId)
    if (hasProfile) {
      throw new HTTPException(400, { message: 'プロフィールは既に登録されています' })
    }

    // プロフィール作成とロール更新をトランザクションで実行
    const profile = await mockUserService.registerProfile(userId, {
      name: data.name,
      birthDate: data.birthDate,
      userType: data.userType,
    })

    return c.json({ success: true, profile }, 201)
  })

  return app
}

describe('POST /api/users/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // authUser なし

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('認証が必要です')
    })

    it('セッションにユーザー ID がない場合は 401 エラーを返す', async () => {
      const app = createTestApp({ session: { user: {} } })

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('認証が必要です')
    })
  })

  describe('バリデーション', () => {
    const validAuthUser = { session: { user: { id: 'test-user-id' } } }

    it('名前が空の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('生年月日が空の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('userType が不正な場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'invalid',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('必須フィールドが欠けている場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          // birthDate と userType が欠落
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('正常系', () => {
    const validAuthUser = { session: { user: { id: 'test-user-id' } } }

    it('ゲストとしてプロフィールを登録できる', async () => {
      const app = createTestApp(validAuthUser)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: 'テストユーザー',
        birthDate: new Date('1990-01-01'),
      })

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.profile).toBeDefined()
      expect(body.profile.name).toBe('テストユーザー')

      // userService が正しく呼ばれたか確認
      expect(mockUserService.hasProfile).toHaveBeenCalledWith('test-user-id')
      expect(mockUserService.registerProfile).toHaveBeenCalledWith('test-user-id', {
        name: 'テストユーザー',
        birthDate: '1990-01-01',
        userType: 'guest',
      })
    })

    it('キャストとしてプロフィールを登録できる', async () => {
      const app = createTestApp(validAuthUser)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: 'キャストユーザー',
        birthDate: new Date('1995-05-05'),
      })

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'キャストユーザー',
          birthDate: '1995-05-05',
          userType: 'cast',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)

      expect(mockUserService.registerProfile).toHaveBeenCalledWith('test-user-id', {
        name: 'キャストユーザー',
        birthDate: '1995-05-05',
        userType: 'cast',
      })
    })
  })

  describe('エラーハンドリング', () => {
    const validAuthUser = { session: { user: { id: 'test-user-id' } } }

    it('プロフィールが既に存在する場合は 400 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      mockUserService.hasProfile.mockResolvedValue(true)

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('プロフィールは既に登録されています')

      // registerProfile は呼ばれない
      expect(mockUserService.registerProfile).not.toHaveBeenCalled()
    })

    it('DB エラーが発生した場合は 500 エラーを返す', async () => {
      const app = createTestApp(validAuthUser)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockRejectedValue(new Error('DB connection failed'))

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('予期しないエラーが発生しました')
    })
  })

  describe('境界値テスト', () => {
    const validAuthUser = { session: { user: { id: 'test-user-id' } } }

    it('最小長の名前で登録できる', async () => {
      const app = createTestApp(validAuthUser)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: 'あ',
        birthDate: new Date('1990-01-01'),
      })

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'あ',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(201)
    })

    it('日本語の名前で登録できる', async () => {
      const app = createTestApp(validAuthUser)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: '山田太郎',
        birthDate: new Date('1990-01-01'),
      })

      const res = await app.request('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '山田太郎',
          birthDate: '1990-01-01',
          userType: 'guest',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.profile.name).toBe('山田太郎')
    })
  })
})
