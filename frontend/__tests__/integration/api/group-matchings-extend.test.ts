/**
 * PATCH /api/group-matchings/guest/:id/extend API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * グループマッチング延長APIエンドポイントのバリデーション、認証、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアとサービス層をモックする
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGuestGroupMatchingsApp } from '@/app/api/group-matchings/guest/[[...route]]/route'
import {
	createMockAuthMiddleware,
	type MockAuthToken,
} from '@tests/utils/mock-auth'
import { userService } from '@/features/user/services/userService'
import { groupMatchingService } from '@/features/group-matching/services/groupMatchingService'
import type { InferSelectModel } from 'drizzle-orm'
import { users } from '@/libs/db/schema/users'

type User = InferSelectModel<typeof users>

// サービス層のモック
vi.mock('@/features/user/services/userService', () => ({
	userService: {
		findUserById: vi.fn(),
	},
}))

vi.mock('@/features/group-matching/services/groupMatchingService', () => ({
	groupMatchingService: {
		createGroupMatching: vi.fn(),
		getGuestGroupMatchings: vi.fn(),
		extendGroupMatching: vi.fn(),
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
const mockGroupMatchingService = vi.mocked(groupMatchingService)

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
	const { app } = createGuestGroupMatchingsApp({
		authMiddleware: createMockAuthMiddleware(token),
		verifyAuthMiddleware: noopVerifyAuth,
	})
	return app
}

/**
 * テスト用のモックグループマッチングデータ
 */
function createMockGroupMatching(overrides = {}) {
	return {
		id: 'matching-123',
		guestId: 'guest-123',
		chatRoomId: 'chat-123',
		status: 'in_progress' as const,
		proposedDate: '2025-11-28T18:00:00.000Z',
		proposedDuration: 120,
		proposedLocation: '渋谷',
		totalPoints: 18000,
		startedAt: '2025-11-28T18:00:00.000Z',
		scheduledEndAt: '2025-11-28T20:00:00.000Z',
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		recruitingEndedAt: '2025-11-28T17:30:00.000Z',
		requestedCastCount: 3,
		createdAt: '2025-11-28T10:00:00.000Z',
		updatedAt: '2025-11-28T18:00:00.000Z',
		type: 'group' as const,
		participantSummary: {
			pendingCount: 0,
			acceptedCount: 3,
			rejectedCount: 0,
			joinedCount: 3,
		},
		...overrides,
	}
}

describe('PATCH /api/group-matchings/guest/:id/extend', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})

		it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
			const app = createTestApp({ role: 'guest' }) // id なし

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('キャストがマッチングを延長しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'user-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'user-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ゲストのみマッチングを延長できます')
		})

		it('管理者がマッチングを延長しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'admin-123', role: 'admin' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'admin-123',
				email: 'admin@example.com',
				emailVerified: null,
				password: null,
				role: 'admin',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ゲストのみマッチングを延長できます')
		})
	})

	describe('バリデーション', () => {
		it('延長時間が0以下の場合は 400 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 0,
					}),
				},
			)

			expect(res.status).toBe(400)
		})

		it('延長時間が負の場合は 400 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: -30,
					}),
				},
			)

			expect(res.status).toBe(400)
		})

		it('延長時間が30分単位でない場合は 400 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 45, // 30分単位ではない
					}),
				},
			)

			expect(res.status).toBe(400)
		})

		it('延長時間が小数の場合は 400 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30.5,
					}),
				},
			)

			expect(res.status).toBe(400)
		})

		it('延長時間がない場合は 400 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
				},
			)

			expect(res.status).toBe(400)
		})
	})

	describe('正常系', () => {
		it('ゲストがグループマッチングを30分延長できる', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const extendedMatching = createMockGroupMatching({
				extensionMinutes: 30,
				extensionPoints: 4500,
				scheduledEndAt: '2025-11-28T20:30:00.000Z',
			})

			mockGroupMatchingService.extendGroupMatching.mockResolvedValue(
				extendedMatching,
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching).toBeDefined()
			expect(body.groupMatching.extensionMinutes).toBe(30)
			expect(body.groupMatching.extensionPoints).toBe(4500)

			// サービスが正しい引数で呼ばれたことを確認
			expect(mockGroupMatchingService.extendGroupMatching).toHaveBeenCalledWith(
				'matching-123',
				'guest-123',
				30,
			)
		})

		it('ゲストがグループマッチングを60分延長できる', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const extendedMatching = createMockGroupMatching({
				extensionMinutes: 60,
				extensionPoints: 9000,
				scheduledEndAt: '2025-11-28T21:00:00.000Z',
			})

			mockGroupMatchingService.extendGroupMatching.mockResolvedValue(
				extendedMatching,
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 60,
					}),
				},
			)

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching.extensionMinutes).toBe(60)
			expect(body.groupMatching.extensionPoints).toBe(9000)
		})

		it('ゲストがグループマッチングを120分延長できる', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const extendedMatching = createMockGroupMatching({
				extensionMinutes: 120,
				extensionPoints: 18000,
				scheduledEndAt: '2025-11-28T22:00:00.000Z',
			})

			mockGroupMatchingService.extendGroupMatching.mockResolvedValue(
				extendedMatching,
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 120,
					}),
				},
			)

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching.extensionMinutes).toBe(120)
		})
	})

	describe('エラーハンドリング', () => {
		it('ユーザーが見つからない場合は 404 エラーを返す', async () => {
			const app = createTestApp({ id: 'nonexistent-user', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue(null as unknown as User)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(404)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ユーザーが見つかりません')
		})

		it('マッチングが見つからない場合のサービスエラーは 500 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.extendGroupMatching.mockRejectedValue(
				new Error('マッチングが見つかりません'),
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('マッチングが見つかりません')
		})

		it('権限がない場合のサービスエラーは 500 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.extendGroupMatching.mockRejectedValue(
				new Error('このマッチングを延長する権限がありません'),
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('このマッチングを延長する権限がありません')
		})

		it('マッチングがin_progress状態でない場合のサービスエラーは 500 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.extendGroupMatching.mockRejectedValue(
				new Error('進行中のマッチングのみ延長できます'),
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('進行中のマッチングのみ延長できます')
		})

		it('データベースエラーが発生した場合は 500 エラーを返す', async () => {
			const app = createTestApp({ id: 'guest-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'guest-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.extendGroupMatching.mockRejectedValue(
				new Error('Database error'),
			)

			const res = await app.request(
				'/api/group-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						extensionMinutes: 30,
					}),
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('Database error')
		})
	})
})
