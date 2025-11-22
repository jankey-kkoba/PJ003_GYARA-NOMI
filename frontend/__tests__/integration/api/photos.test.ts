/**
 * /api/casts/photos API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * プロフィール写真アップロードAPIの認証、ロールチェック、ファイルアップロード、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアとstorageServiceをモックする
 * seed.sqlで用意されたテストデータを使用
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPhotosApp } from '@/app/api/casts/photos/[[...route]]/route'
import { createMockAuthMiddleware, type MockAuthToken } from '@tests/utils/mock-auth'
import { db } from '@/libs/db'
import { castProfilePhotos } from '@/libs/db/schema/cast-profile-photos'
import { eq, like } from 'drizzle-orm'

// storageService のモック
vi.mock('@/features/cast-profile-photo/services/storageService', () => ({
  storageService: {
    uploadPhoto: vi.fn(),
    deletePhoto: vi.fn(),
    deletePhotos: vi.fn(),
    getPublicUrl: vi.fn((path: string) => `https://example.com/storage/${path}`),
  },
}))

// 環境変数のモック（DATABASE_URLは実際の値を使用）
vi.mock('@/libs/constants/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/constants/env')>()
  return {
    ...actual,
    AUTH_SECRET: 'test-secret',
    LINE_CLIENT_ID: 'test-client-id',
    LINE_CLIENT_SECRET: 'test-client-secret',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  }
})

// モック化された storageService を取得
const { storageService } = await import('@/features/cast-profile-photo/services/storageService')
const mockStorageService = vi.mocked(storageService)

/**
 * テスト用の認証検証ミドルウェア（何もしない）
 */
const noopVerifyAuth = async (_c: unknown, next: () => Promise<void>) => {
  await next()
}

/**
 * テスト用アプリを作成
 */
function createTestApp(token?: MockAuthToken) {
  const { app } = createPhotosApp({
    authMiddleware: createMockAuthMiddleware(token),
    verifyAuthMiddleware: noopVerifyAuth,
  })
  return app
}

// 新規作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-photo-api-'

// 新規作成したデータのクリーンアップ
async function cleanupTestData() {
  const testPhotos = await db
    .select({ id: castProfilePhotos.id })
    .from(castProfilePhotos)
    .where(like(castProfilePhotos.id, `${TEST_PREFIX}%`))

  for (const { id } of testPhotos) {
    await db.delete(castProfilePhotos).where(eq(castProfilePhotos.id, id))
  }
}

describe('/api/casts/photos', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('POST /api/casts/photos', () => {
    describe('認証チェック', () => {
      it('認証されていない場合は 401 エラーを返す', async () => {
        const app = createTestApp() // token なし

        const formData = new FormData()
        formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(body.error).toBe('認証が必要です')
      })

      it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
        const app = createTestApp({ role: 'cast' }) // id なし

        const formData = new FormData()
        formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.error).toBe('認証が必要です')
      })
    })

    describe('ロールチェック', () => {
      it('ゲストユーザーは 403 エラーを返す', async () => {
        const app = createTestApp({ id: 'guest-user-id', role: 'guest' })

        const formData = new FormData()
        formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(403)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(body.error).toBe('この機能はキャストユーザーのみ利用できます')
      })
    })

    describe('バリデーション', () => {
      it('ファイルがない場合は 400 エラーを返す', async () => {
        const app = createTestApp({ id: 'seed-user-cast-003', role: 'cast' })

        const formData = new FormData()

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('画像ファイルが必要です')
      })

      it('許可されていないファイルタイプの場合は 400 エラーを返す', async () => {
        const app = createTestApp({ id: 'seed-user-cast-003', role: 'cast' })

        const formData = new FormData()
        formData.append('file', new File(['test'], 'test.txt', { type: 'text/plain' }))

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toContain('許可されていないファイル形式です')
      })

      it('ファイルサイズが大きすぎる場合は 400 エラーを返す', async () => {
        const app = createTestApp({ id: 'seed-user-cast-003', role: 'cast' })

        // 6MBのファイルを作成
        const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
          type: 'image/jpeg',
        })
        const formData = new FormData()
        formData.append('file', largeFile)

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toContain('ファイルサイズは5MB以下')
      })
    })

    describe('正常系', () => {
      it('プロフィール写真をアップロードできる', async () => {
        // seed.sqlで用意されたキャスト（写真なし）
        const testCastId = 'seed-user-cast-003'
        const app = createTestApp({ id: testCastId, role: 'cast' })

        // storageService.uploadPhoto のモックを設定
        mockStorageService.uploadPhoto.mockResolvedValue({
          photoUrl: `${testCastId}/test.jpg`,
          publicUrl: 'https://example.com/storage/test.jpg',
        })

        const formData = new FormData()
        formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

        const res = await app.request('/api/casts/photos', {
          method: 'POST',
          body: formData,
        })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.data.photo).toMatchObject({
          castProfileId: testCastId,
          photoUrl: `${testCastId}/test.jpg`,
          displayOrder: 0,
        })
        expect(body.data.photo.publicUrl).toBeDefined()
      })
    })
  })

  describe('GET /api/casts/photos/:castId', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

      const res = await app.request('/api/casts/photos/seed-user-cast-001', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
    })

    it('キャストの写真一覧を取得できる (seed data)', async () => {
      const app = createTestApp({ id: 'seed-user-guest-001', role: 'guest' })

      // seed-user-cast-001には3枚の写真がある
      const res = await app.request('/api/casts/photos/seed-user-cast-001', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.photos).toHaveLength(3)
      expect(body.data.photos[0].publicUrl).toBeDefined()
    })
  })

  describe('DELETE /api/casts/photos/:photoId', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

      const res = await app.request('/api/casts/photos/test-photo-id', {
        method: 'DELETE',
      })

      expect(res.status).toBe(401)
    })

    it('ゲストユーザーは 403 エラーを返す', async () => {
      const app = createTestApp({ id: 'seed-user-guest-001', role: 'guest' })

      const res = await app.request('/api/casts/photos/test-photo-id', {
        method: 'DELETE',
      })

      expect(res.status).toBe(403)
    })

    it('自分のプロフィール写真を削除できる', async () => {
      const testCastId = 'seed-user-cast-003'
      const app = createTestApp({ id: testCastId, role: 'cast' })

      // テスト用の写真を作成
      const photoId = `${TEST_PREFIX}${crypto.randomUUID()}`
      await db.insert(castProfilePhotos).values({
        id: photoId,
        castProfileId: testCastId,
        photoUrl: `${testCastId}/photo.jpg`,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockStorageService.deletePhoto.mockResolvedValue()

      const res = await app.request(`/api/casts/photos/${photoId}`, {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)

      // DBから削除されていることを確認
      const photos = await db
        .select()
        .from(castProfilePhotos)
        .where(eq(castProfilePhotos.id, photoId))
      expect(photos).toHaveLength(0)
    })

    it('他人のプロフィール写真は削除できない', async () => {
      const app = createTestApp({ id: 'seed-user-cast-004', role: 'cast' })

      // seed-user-cast-001の写真を使用
      const res = await app.request('/api/casts/photos/seed-photo-cast-001-1', {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('写真が見つかりません')
    })
  })

  describe('PUT /api/casts/photos/:photoId', () => {
    it('認証されていない場合は 401 エラーを返す', async () => {
      const app = createTestApp() // token なし

      const res = await app.request('/api/casts/photos/test-photo-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: 1 }),
      })

      expect(res.status).toBe(401)
    })

    it('プロフィール写真の表示順を更新できる', async () => {
      const testCastId = 'seed-user-cast-001'
      const app = createTestApp({ id: testCastId, role: 'cast' })

      // seed.sqlの写真を使用
      const res = await app.request('/api/casts/photos/seed-photo-cast-001-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: 5 }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.photo.displayOrder).toBe(5)

      // 元に戻す
      await app.request('/api/casts/photos/seed-photo-cast-001-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: 0 }),
      })
    })
  })
})
