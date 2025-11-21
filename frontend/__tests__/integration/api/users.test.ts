/**
 * POST /api/users/register API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * API エンドポイントのバリデーション、認証、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアのみをモックする
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUsersApp } from '@/app/api/users/[[...route]]/route'
import { createMockAuthMiddleware, type MockAuthToken } from '@tests/utils/mock-auth'
import { userService } from '@/features/user/services/userService'

// userService のモック
vi.mock('@/features/user/services/userService', () => ({
  userService: {
    hasProfile: vi.fn(),
    registerProfile: vi.fn(),
  },
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
  AUTH_SECRET: 'test-secret',
  LINE_CLIENT_ID: 'test-client-id',
  LINE_CLIENT_SECRET: 'test-client-secret',
}))

// モック化された userService を取得
const mockUserService = vi.mocked(userService)

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
  const { app } = createUsersApp({
    authMiddleware: createMockAuthMiddleware(token),
    verifyAuthMiddleware: noopVerifyAuth,
  })
  return app
}

describe('POST /api/users/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証チェック', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

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

    it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
      const app = createTestApp({ role: 'guest' }) // id なし

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
    const validToken = { id: 'test-user-id', role: 'guest' as const }

    it('名前が空の場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

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
      const app = createTestApp(validToken)

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
      const app = createTestApp(validToken)

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
      const app = createTestApp(validToken)

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
    const validToken = { id: 'test-user-id', role: 'guest' as const }

    it('ゲストとしてプロフィールを登録できる', async () => {
      const app = createTestApp(validToken)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: 'テストユーザー',
        birthDate: '1990-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const app = createTestApp(validToken)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: 'キャストユーザー',
        birthDate: '1995-05-05',
        createdAt: new Date(),
        updatedAt: new Date(),
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
    const validToken = { id: 'test-user-id', role: 'guest' as const }

    it('プロフィールが既に存在する場合は 400 エラーを返す', async () => {
      const app = createTestApp(validToken)

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
      const app = createTestApp(validToken)

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
    const validToken = { id: 'test-user-id', role: 'guest' as const }

    it('最小長の名前で登録できる', async () => {
      const app = createTestApp(validToken)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: 'あ',
        birthDate: '1990-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const app = createTestApp(validToken)

      mockUserService.hasProfile.mockResolvedValue(false)
      mockUserService.registerProfile.mockResolvedValue({
        id: 'test-user-id',
        name: '山田太郎',
        birthDate: '1990-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
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
