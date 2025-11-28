/**
 * お気に入りAPI 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * 認証、ロールチェック、お気に入りの追加・削除・確認を検証する
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFavoritesApp } from '@/app/api/favorites/[[...route]]/route'
import {
	createMockAuthMiddleware,
	type MockAuthToken,
} from '@tests/utils/mock-auth'
import { favoriteService } from '@/features/favorite/services/favoriteService'

// favoriteService のモック
vi.mock('@/features/favorite/services/favoriteService', () => ({
	favoriteService: {
		addFavorite: vi.fn(),
		removeFavorite: vi.fn(),
		isFavorite: vi.fn(),
	},
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
	AUTH_SECRET: 'test-secret',
	LINE_CLIENT_ID: 'test-client-id',
	LINE_CLIENT_SECRET: 'test-client-secret',
}))

const mockFavoriteService = vi.mocked(favoriteService)

const noopVerifyAuth = async (_c: unknown, next: () => Promise<void>) => {
	await next()
}

function createTestApp(token?: MockAuthToken) {
	const { app } = createFavoritesApp({
		authMiddleware: createMockAuthMiddleware(token),
		verifyAuthMiddleware: noopVerifyAuth,
	})
	return app
}

describe('GET /api/favorites/:castId', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp()

			const res = await app.request('/api/favorites/cast-123', {
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

			const res = await app.request('/api/favorites/cast-123', {
				method: 'GET',
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
		})
	})

	describe('正常系', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('お気に入り状態を取得できる（お気に入り登録済み）', async () => {
			const app = createTestApp(validToken)
			mockFavoriteService.isFavorite.mockResolvedValue(true)

			const res = await app.request('/api/favorites/cast-123', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data.isFavorite).toBe(true)
			expect(mockFavoriteService.isFavorite).toHaveBeenCalledWith(
				'guest-user-id',
				'cast-123',
			)
		})

		it('お気に入り状態を取得できる（未登録）', async () => {
			const app = createTestApp(validToken)
			mockFavoriteService.isFavorite.mockResolvedValue(false)

			const res = await app.request('/api/favorites/cast-123', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.data.isFavorite).toBe(false)
		})
	})
})

describe('POST /api/favorites/:castId', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp()

			const res = await app.request('/api/favorites/cast-123', {
				method: 'POST',
			})

			expect(res.status).toBe(401)
		})
	})

	describe('正常系', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('お気に入りに追加できる', async () => {
			const app = createTestApp(validToken)
			mockFavoriteService.addFavorite.mockResolvedValue()

			const res = await app.request('/api/favorites/cast-123', {
				method: 'POST',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data.isFavorite).toBe(true)
			expect(mockFavoriteService.addFavorite).toHaveBeenCalledWith(
				'guest-user-id',
				'cast-123',
			)
		})
	})
})

describe('DELETE /api/favorites/:castId', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp()

			const res = await app.request('/api/favorites/cast-123', {
				method: 'DELETE',
			})

			expect(res.status).toBe(401)
		})
	})

	describe('正常系', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('お気に入りから削除できる', async () => {
			const app = createTestApp(validToken)
			mockFavoriteService.removeFavorite.mockResolvedValue()

			const res = await app.request('/api/favorites/cast-123', {
				method: 'DELETE',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data.isFavorite).toBe(false)
			expect(mockFavoriteService.removeFavorite).toHaveBeenCalledWith(
				'guest-user-id',
				'cast-123',
			)
		})
	})
})
