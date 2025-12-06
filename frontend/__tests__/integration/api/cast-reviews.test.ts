/**
 * キャスト評価API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * 認証、ロールチェック、評価の作成・取得を検証する
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCastReviewsApp } from '@/app/api/cast-reviews/[[...route]]/route'
import {
	createMockAuthMiddleware,
	type MockAuthToken,
} from '@tests/utils/mock-auth'
import { castReviewService } from '@/features/cast-review/services/castReviewService'

// castReviewService のモック
vi.mock('@/features/cast-review/services/castReviewService', () => ({
	castReviewService: {
		createReview: vi.fn(),
		getReviewByMatchingId: vi.fn(),
		hasReview: vi.fn(),
	},
}))

// 環境変数のモック
vi.mock('@/libs/constants/env', () => ({
	AUTH_SECRET: 'test-secret',
	LINE_CLIENT_ID: 'test-client-id',
	LINE_CLIENT_SECRET: 'test-client-secret',
}))

const mockCastReviewService = vi.mocked(castReviewService)

const noopVerifyAuth = async (_c: unknown, next: () => Promise<void>) => {
	await next()
}

function createTestApp(token?: MockAuthToken) {
	const { app } = createCastReviewsApp({
		authMiddleware: createMockAuthMiddleware(token),
		verifyAuthMiddleware: noopVerifyAuth,
	})
	return app
}

describe('POST /api/cast-reviews', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp()

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
					rating: 5,
				}),
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

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
					rating: 5,
				}),
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.error).toBe('この機能はゲストユーザーのみ利用できます')
		})
	})

	describe('バリデーション', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('matchingIdが不足している場合は 400 エラーを返す', async () => {
			const app = createTestApp(validToken)

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rating: 5,
				}),
			})

			expect(res.status).toBe(400)
			const body = await res.json()
			expect(body.success).toBe(false)
		})

		it('ratingが不足している場合は 400 エラーを返す', async () => {
			const app = createTestApp(validToken)

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
				}),
			})

			expect(res.status).toBe(400)
			const body = await res.json()
			expect(body.success).toBe(false)
		})

		it('ratingが範囲外の場合は 400 エラーを返す', async () => {
			const app = createTestApp(validToken)

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
					rating: 6,
				}),
			})

			expect(res.status).toBe(400)
			const body = await res.json()
			expect(body.success).toBe(false)
		})
	})

	describe('正常系', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('評価を作成できる', async () => {
			const app = createTestApp(validToken)
			const mockReview = {
				id: 'review-123',
				matchingId: 'matching-123',
				guestId: 'guest-user-id',
				castId: 'cast-123',
				rating: 5,
				comment: 'とても良かったです',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			mockCastReviewService.createReview.mockResolvedValue(mockReview)

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
					rating: 5,
					comment: 'とても良かったです',
				}),
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data.rating).toBe(5)
			expect(body.data.comment).toBe('とても良かったです')
			expect(mockCastReviewService.createReview).toHaveBeenCalledWith(
				'guest-user-id',
				'matching-123',
				5,
				'とても良かったです',
			)
		})

		it('コメントなしで評価を作成できる', async () => {
			const app = createTestApp(validToken)
			const mockReview = {
				id: 'review-123',
				matchingId: 'matching-123',
				guestId: 'guest-user-id',
				castId: 'cast-123',
				rating: 4,
				comment: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			mockCastReviewService.createReview.mockResolvedValue(mockReview)

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
					rating: 4,
				}),
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data.rating).toBe(4)
			expect(mockCastReviewService.createReview).toHaveBeenCalledWith(
				'guest-user-id',
				'matching-123',
				4,
				undefined,
			)
		})
	})

	describe('エラーハンドリング', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('サービス層のエラーは 500 を返す', async () => {
			const app = createTestApp(validToken)
			mockCastReviewService.createReview.mockRejectedValue(
				new Error('このマッチングは既に評価済みです'),
			)

			const res = await app.request('/api/cast-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchingId: 'matching-123',
					rating: 5,
				}),
			})

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('このマッチングは既に評価済みです')
		})
	})
})

describe('GET /api/cast-reviews/:matchingId', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp()

			const res = await app.request('/api/cast-reviews/matching-123', {
				method: 'GET',
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('正常系', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('評価を取得できる', async () => {
			const app = createTestApp(validToken)
			const mockReview = {
				id: 'review-123',
				matchingId: 'matching-123',
				guestId: 'guest-user-id',
				castId: 'cast-123',
				rating: 5,
				comment: 'とても良かったです',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			mockCastReviewService.getReviewByMatchingId.mockResolvedValue(mockReview)

			const res = await app.request('/api/cast-reviews/matching-123', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data.rating).toBe(5)
			expect(mockCastReviewService.getReviewByMatchingId).toHaveBeenCalledWith(
				'matching-123',
			)
		})

		it('評価が存在しない場合はnullを返す', async () => {
			const app = createTestApp(validToken)
			mockCastReviewService.getReviewByMatchingId.mockResolvedValue(null)

			const res = await app.request('/api/cast-reviews/matching-123', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.data).toBeNull()
		})
	})

	describe('エラーハンドリング', () => {
		const validToken = { id: 'guest-user-id', role: 'guest' as const }

		it('サービス層のエラーは 500 を返す', async () => {
			const app = createTestApp(validToken)
			mockCastReviewService.getReviewByMatchingId.mockRejectedValue(
				new Error('データベースエラー'),
			)

			const res = await app.request('/api/cast-reviews/matching-123', {
				method: 'GET',
			})

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('データベースエラー')
		})
	})
})
