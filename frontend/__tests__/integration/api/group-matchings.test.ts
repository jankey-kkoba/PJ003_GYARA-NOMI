/**
 * /api/group-matchings API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * API エンドポイントのバリデーション、認証、エラーハンドリングを検証する
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
import type {
	CreateGroupMatchingResult,
	GuestGroupMatching,
} from '@/features/group-matching/types/groupMatching'
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

describe('POST /api/group-matchings/guest', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})

		it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
			const app = createTestApp({ role: 'guest' }) // id なし

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('キャストがグループマッチングオファーを送信しようとした場合は 403 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe(
				'ゲストのみグループマッチングオファーを送信できます',
			)
		})

		it('管理者がグループマッチングオファーを送信しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'admin-123', role: 'admin' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'admin-123',
				email: 'admin@example.com',
				emailVerified: null,
				password: null,
				role: 'admin',
				createdAt: new Date(),
				updatedAt: new Date(),
			})

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe(
				'ゲストのみグループマッチングオファーを送信できます',
			)
		})
	})

	describe('バリデーション', () => {
		it('希望人数が0以下の場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 0, // 無効な値
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(400)
		})

		it('希望人数が10人を超える場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 11, // 無効な値
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(400)
		})

		it('希望時間が30分未満の場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 20, // 30分未満
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(400)
		})

		it('希望時間が480分（8時間）を超える場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 500, // 8時間超
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(400)
		})

		it('希望場所が空の場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '', // 空
				}),
			})

			expect(res.status).toBe(400)
		})

		it('minAgeが18未満の場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					minAge: 17, // 18未満
				}),
			})

			expect(res.status).toBe(400)
		})

		it('maxAgeが18未満の場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					maxAge: 17, // 18未満
				}),
			})

			expect(res.status).toBe(400)
		})

		it('minAgeが99を超える場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					minAge: 100, // 99超
				}),
			})

			expect(res.status).toBe(400)
		})

		it('minAgeがmaxAgeより大きい場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					minAge: 30,
					maxAge: 25, // minAge > maxAge
				}),
			})

			expect(res.status).toBe(400)
		})

		it('minAgeが小数の場合は 400 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					minAge: 25.5, // 小数
				}),
			})

			expect(res.status).toBe(400)
		})
	})

	describe('正常系', () => {
		it('ゲストがグループマッチングオファーを送信できる（相対時間指定）', async () => {
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

			const mockResult: CreateGroupMatchingResult = {
				matching: {
					id: 'matching-123',
					guestId: 'guest-123',
					chatRoomId: null,
					status: 'pending',
					proposedDate: new Date(Date.now() + 3600000),
					proposedDuration: 120,
					proposedLocation: '渋谷',
					totalPoints: 18000, // 3人 × 2時間 × 3000ポイント/時間
					startedAt: null,
					scheduledEndAt: null,
					actualEndAt: null,
					extensionMinutes: 0,
					extensionPoints: 0,
					recruitingEndedAt: null,
					requestedCastCount: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				participantCount: 5,
			}

			mockGroupMatchingService.createGroupMatching.mockResolvedValue(mockResult)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(201)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching).toBeDefined()
			expect(body.groupMatching.guestId).toBe('guest-123')
			expect(body.groupMatching.requestedCastCount).toBe(3)
			expect(body.groupMatching.totalPoints).toBe(18000)
			expect(body.participantCount).toBe(5)
		})

		it('ゲストがグループマッチングオファーを送信できる（カスタム日時指定）', async () => {
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

			const proposedDate = new Date(Date.now() + 86400000) // 明日

			const mockResult: CreateGroupMatchingResult = {
				matching: {
					id: 'matching-456',
					guestId: 'guest-123',
					chatRoomId: null,
					status: 'pending',
					proposedDate,
					proposedDuration: 180,
					proposedLocation: '新宿',
					totalPoints: 45000, // 5人 × 3時間 × 3000ポイント/時間
					startedAt: null,
					scheduledEndAt: null,
					actualEndAt: null,
					extensionMinutes: 0,
					extensionPoints: 0,
					recruitingEndedAt: null,
					requestedCastCount: 5,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				participantCount: 3,
			}

			mockGroupMatchingService.createGroupMatching.mockResolvedValue(mockResult)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 5,
					proposedDate: proposedDate.toISOString(),
					proposedDuration: 180,
					proposedLocation: '新宿',
				}),
			})

			expect(res.status).toBe(201)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching).toBeDefined()
			expect(body.groupMatching.requestedCastCount).toBe(5)
			expect(body.groupMatching.totalPoints).toBe(45000)
			expect(body.participantCount).toBe(3)
		})

		it('年齢フィルタを指定してグループマッチングオファーを送信できる', async () => {
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

			const mockResult: CreateGroupMatchingResult = {
				matching: {
					id: 'matching-789',
					guestId: 'guest-123',
					chatRoomId: null,
					status: 'pending',
					proposedDate: new Date(Date.now() + 3600000),
					proposedDuration: 120,
					proposedLocation: '渋谷',
					totalPoints: 18000,
					startedAt: null,
					scheduledEndAt: null,
					actualEndAt: null,
					extensionMinutes: 0,
					extensionPoints: 0,
					recruitingEndedAt: null,
					requestedCastCount: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				participantCount: 2, // 年齢フィルタで絞られた結果
			}

			mockGroupMatchingService.createGroupMatching.mockResolvedValue(mockResult)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					minAge: 25,
					maxAge: 30,
				}),
			})

			expect(res.status).toBe(201)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.participantCount).toBe(2)

			// サービスに年齢フィルタが渡されていることを確認
			expect(mockGroupMatchingService.createGroupMatching).toHaveBeenCalledWith(
				expect.objectContaining({
					minAge: 25,
					maxAge: 30,
				}),
			)
		})
	})

	describe('エラーハンドリング', () => {
		it('ユーザーが見つからない場合は 404 エラーを返す', async () => {
			const app = createTestApp({ id: 'nonexistent-user', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue(null as unknown as User)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(404)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ユーザーが見つかりません')
		})

		it('サービス層でエラーが発生した場合は 500 エラーを返す', async () => {
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

			mockGroupMatchingService.createGroupMatching.mockRejectedValue(
				new Error('Database error'),
			)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedCastCount: 3,
					proposedTimeOffsetMinutes: 60,
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			})

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('Database error')
		})
	})
})

describe('GET /api/group-matchings/guest', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})

		it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
			const app = createTestApp({ role: 'guest' }) // id なし

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('キャストがグループマッチング一覧を取得しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'user-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'user-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date(),
				updatedAt: new Date(),
			})

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ゲストのみグループマッチング一覧を取得できます')
		})

		it('管理者がグループマッチング一覧を取得しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'admin-123', role: 'admin' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'admin-123',
				email: 'admin@example.com',
				emailVerified: null,
				password: null,
				role: 'admin',
				createdAt: new Date(),
				updatedAt: new Date(),
			})

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ゲストのみグループマッチング一覧を取得できます')
		})
	})

	describe('正常系', () => {
		it('ゲストがグループマッチング一覧を取得できる', async () => {
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

			const mockMatchings: GuestGroupMatching[] = [
				{
					id: 'matching-1',
					guestId: 'guest-123',
					chatRoomId: null,
					status: 'pending',
					proposedDate: new Date(),
					proposedDuration: 120,
					proposedLocation: '渋谷',
					totalPoints: 18000,
					startedAt: null,
					scheduledEndAt: null,
					actualEndAt: null,
					extensionMinutes: 0,
					extensionPoints: 0,
					recruitingEndedAt: null,
					requestedCastCount: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
					type: 'group',
					participantSummary: {
						pendingCount: 2,
						acceptedCount: 1,
						rejectedCount: 0,
						joinedCount: 0,
					},
				},
				{
					id: 'matching-2',
					guestId: 'guest-123',
					chatRoomId: null,
					status: 'accepted',
					proposedDate: new Date(),
					proposedDuration: 180,
					proposedLocation: '新宿',
					totalPoints: 27000,
					startedAt: null,
					scheduledEndAt: null,
					actualEndAt: null,
					extensionMinutes: 0,
					extensionPoints: 0,
					recruitingEndedAt: null,
					requestedCastCount: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
					type: 'group',
					participantSummary: {
						pendingCount: 0,
						acceptedCount: 3,
						rejectedCount: 0,
						joinedCount: 0,
					},
				},
			]

			mockGroupMatchingService.getGuestGroupMatchings.mockResolvedValue(
				mockMatchings,
			)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatchings).toHaveLength(2)
			expect(body.groupMatchings[0].id).toBe('matching-1')
			expect(body.groupMatchings[0].participantSummary.pendingCount).toBe(2)
			expect(body.groupMatchings[1].id).toBe('matching-2')
			expect(body.groupMatchings[1].status).toBe('accepted')
		})

		it('グループマッチングがない場合は空配列を返す', async () => {
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

			mockGroupMatchingService.getGuestGroupMatchings.mockResolvedValue([])

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatchings).toEqual([])
		})
	})

	describe('エラーハンドリング', () => {
		it('ユーザーが見つからない場合は 404 エラーを返す', async () => {
			const app = createTestApp({ id: 'nonexistent-user', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue(null as unknown as User)

			const res = await app.request('/api/group-matchings/guest', {
				method: 'GET',
			})

			expect(res.status).toBe(404)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ユーザーが見つかりません')
		})
	})
})
