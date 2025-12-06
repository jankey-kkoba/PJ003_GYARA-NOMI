/**
 * /api/group-matchings/cast API 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * API エンドポイントの認証、ロールチェック、エラーハンドリングを検証する
 *
 * 実際の API コードを使用し、認証ミドルウェアとサービス層をモックする
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCastGroupMatchingsApp } from '@/app/api/group-matchings/cast/[[...route]]/route'
import {
	createMockAuthMiddleware,
	type MockAuthToken,
} from '@tests/utils/mock-auth'
import { userService } from '@/features/user/services/userService'
import { groupMatchingService } from '@/features/group-matching/services/groupMatchingService'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'
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
		getCastGroupMatchings: vi.fn(),
		respondToGroupMatching: vi.fn(),
		startGroupMatching: vi.fn(),
		completeGroupMatching: vi.fn(),
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
	const { app } = createCastGroupMatchingsApp({
		authMiddleware: createMockAuthMiddleware(token),
		verifyAuthMiddleware: noopVerifyAuth,
	})
	return app
}

describe('GET /api/group-matchings/cast', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request('/api/group-matchings/cast', {
				method: 'GET',
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})

		it('トークンにユーザー ID がない場合は 401 エラーを返す', async () => {
			const app = createTestApp({ role: 'cast' }) // id なし

			const res = await app.request('/api/group-matchings/cast', {
				method: 'GET',
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('ゲストがグループマッチング一覧を取得しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'user-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'user-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request('/api/group-matchings/cast', {
				method: 'GET',
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe(
				'キャストのみグループマッチング一覧を取得できます',
			)
		})

		it('管理者がグループマッチング一覧を取得しようとした場合は 403 エラーを返す', async () => {
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

			const res = await app.request('/api/group-matchings/cast', {
				method: 'GET',
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe(
				'キャストのみグループマッチング一覧を取得できます',
			)
		})
	})

	describe('正常系', () => {
		it('キャストがグループマッチング一覧を取得できる', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const mockMatchings: CastGroupMatching[] = [
				{
					id: 'matching-1',
					guestId: 'guest-001',
					chatRoomId: null,
					status: 'pending',
					proposedDate: new Date().toISOString(),
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
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					type: 'group',
					participantStatus: 'pending',
					guest: {
						id: 'guest-001',
						nickname: 'テストゲスト1',
					},
					participantSummary: {
						requestedCount: 3,
						acceptedCount: 1,
						joinedCount: 0,
					},
				},
				{
					id: 'matching-2',
					guestId: 'guest-002',
					chatRoomId: null,
					status: 'accepted',
					proposedDate: new Date().toISOString(),
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
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					type: 'group',
					participantStatus: 'accepted',
					guest: {
						id: 'guest-002',
						nickname: 'テストゲスト2',
					},
					participantSummary: {
						requestedCount: 3,
						acceptedCount: 3,
						joinedCount: 0,
					},
				},
			]

			mockGroupMatchingService.getCastGroupMatchings.mockResolvedValue(
				mockMatchings,
			)

			const res = await app.request('/api/group-matchings/cast', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatchings).toHaveLength(2)
			expect(body.groupMatchings[0].id).toBe('matching-1')
			expect(body.groupMatchings[0].participantStatus).toBe('pending')
			expect(body.groupMatchings[0].guest.nickname).toBe('テストゲスト1')
			expect(body.groupMatchings[1].id).toBe('matching-2')
			expect(body.groupMatchings[1].participantStatus).toBe('accepted')
		})

		it('グループマッチングがない場合は空配列を返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.getCastGroupMatchings.mockResolvedValue([])

			const res = await app.request('/api/group-matchings/cast', {
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
			const app = createTestApp({ id: 'nonexistent-user', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue(null as unknown as User)

			const res = await app.request('/api/group-matchings/cast', {
				method: 'GET',
			})

			expect(res.status).toBe(404)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ユーザーが見つかりません')
		})
	})
})

describe('PATCH /api/group-matchings/cast/:id', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('認証されていない場合は 401 エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ response: 'accepted' }),
			})

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('ゲストがグループマッチングに回答しようとした場合は 403 エラーを返す', async () => {
			const app = createTestApp({ id: 'user-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'user-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ response: 'accepted' }),
			})

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('キャストのみグループマッチングに回答できます')
		})
	})

	describe('バリデーション', () => {
		it('responseが不正な値の場合はエラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ response: 'invalid' }),
			})

			expect(res.status).toBe(400)
		})

		it('responseが空の場合はエラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})

			expect(res.status).toBe(400)
		})
	})

	describe('正常系', () => {
		it('キャストがグループマッチングにacceptedで回答できる', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const mockUpdatedMatching: CastGroupMatching = {
				id: 'matching-123',
				guestId: 'guest-001',
				chatRoomId: null,
				status: 'pending',
				proposedDate: new Date().toISOString(),
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
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				type: 'group',
				participantStatus: 'accepted',
				guest: {
					id: 'guest-001',
					nickname: 'テストゲスト',
				},
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 1,
					joinedCount: 0,
				},
			}

			mockGroupMatchingService.respondToGroupMatching.mockResolvedValue(
				mockUpdatedMatching,
			)

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ response: 'accepted' }),
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching.id).toBe('matching-123')
			expect(body.groupMatching.participantStatus).toBe('accepted')

			// サービスが正しいパラメータで呼ばれたことを確認
			expect(
				mockGroupMatchingService.respondToGroupMatching,
			).toHaveBeenCalledWith('matching-123', 'cast-123', 'accepted')
		})

		it('キャストがグループマッチングにrejectedで回答できる', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const mockUpdatedMatching: CastGroupMatching = {
				id: 'matching-123',
				guestId: 'guest-001',
				chatRoomId: null,
				status: 'pending',
				proposedDate: new Date().toISOString(),
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
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				type: 'group',
				participantStatus: 'rejected',
				guest: {
					id: 'guest-001',
					nickname: 'テストゲスト',
				},
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 0,
					joinedCount: 0,
				},
			}

			mockGroupMatchingService.respondToGroupMatching.mockResolvedValue(
				mockUpdatedMatching,
			)

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ response: 'rejected' }),
			})

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching.participantStatus).toBe('rejected')

			// サービスが正しいパラメータで呼ばれたことを確認
			expect(
				mockGroupMatchingService.respondToGroupMatching,
			).toHaveBeenCalledWith('matching-123', 'cast-123', 'rejected')
		})
	})

	describe('エラーハンドリング', () => {
		it('サービスがエラーをスローした場合は 500 エラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.respondToGroupMatching.mockRejectedValue(
				new Error('予期しないエラー'),
			)

			const res = await app.request('/api/group-matchings/cast/matching-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ response: 'accepted' }),
			})

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
		})
	})
})

describe('PATCH /api/group-matchings/cast/:id/start', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('未認証の場合は401エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})

		it('トークンにユーザーIDがない場合は401エラーを返す', async () => {
			const app = createTestApp({ role: 'cast' }) // id なし

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('ゲストがグループマッチングを開始しようとした場合は403エラーを返す', async () => {
			const app = createTestApp({ id: 'user-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'user-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('キャストのみマッチングを開始できます')
		})

		it('管理者がグループマッチングを開始しようとした場合は403エラーを返す', async () => {
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
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('キャストのみマッチングを開始できます')
		})
	})

	describe('正常系', () => {
		it('キャストがグループマッチングを開始できる', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const startedAt = new Date().toISOString()
			const scheduledEndAt = new Date(
				new Date(startedAt).getTime() + 120 * 60 * 1000,
			).toISOString() // 2時間後

			const mockUpdatedMatching: CastGroupMatching = {
				id: 'matching-123',
				guestId: 'guest-001',
				chatRoomId: null,
				status: 'in_progress',
				proposedDate: new Date().toISOString(),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				totalPoints: 18000,
				startedAt,
				scheduledEndAt,
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				recruitingEndedAt: null,
				requestedCastCount: 3,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				type: 'group',
				participantStatus: 'joined',
				guest: {
					id: 'guest-001',
					nickname: 'テストゲスト',
				},
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 2,
					joinedCount: 1,
				},
			}

			mockGroupMatchingService.startGroupMatching.mockResolvedValue(
				mockUpdatedMatching,
			)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching.id).toBe('matching-123')
			expect(body.groupMatching.status).toBe('in_progress')
			expect(body.groupMatching.participantStatus).toBe('joined')
			expect(body.groupMatching.startedAt).toBeDefined()
			expect(body.groupMatching.scheduledEndAt).toBeDefined()

			// サービスが正しいパラメータで呼ばれたことを確認
			expect(mockGroupMatchingService.startGroupMatching).toHaveBeenCalledWith(
				'matching-123',
				'cast-123',
			)
		})
	})

	describe('エラーハンドリング', () => {
		it('ユーザーが見つからない場合は404エラーを返す', async () => {
			const app = createTestApp({ id: 'nonexistent-user', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue(null as unknown as User)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(404)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ユーザーが見つかりません')
		})

		it('サービスがエラーをスローした場合は500エラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.startGroupMatching.mockRejectedValue(
				new Error('マッチングが見つかりません'),
			)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('予期しないエラーが発生しました')
		})

		it('権限がない場合はエラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.startGroupMatching.mockRejectedValue(
				new Error('このマッチングに合流する権限がありません'),
			)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/start',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('予期しないエラーが発生しました')
		})
	})
})

describe('PATCH /api/group-matchings/cast/:id/end', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('認証チェック', () => {
		it('未認証の場合は401エラーを返す', async () => {
			const app = createTestApp() // token なし

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})

		it('トークンにユーザーIDがない場合は401エラーを返す', async () => {
			const app = createTestApp({ role: 'cast' }) // id なし

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(401)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('認証が必要です')
		})
	})

	describe('ロールチェック', () => {
		it('ゲストがグループマッチングを終了しようとした場合は403エラーを返す', async () => {
			const app = createTestApp({ id: 'user-123', role: 'guest' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'user-123',
				email: 'guest@example.com',
				emailVerified: null,
				password: null,
				role: 'guest',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('キャストのみマッチングを終了できます')
		})

		it('管理者がグループマッチングを終了しようとした場合は403エラーを返す', async () => {
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
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('キャストのみマッチングを終了できます')
		})
	})

	describe('正常系', () => {
		it('キャストがグループマッチングを終了できる', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const mockUpdatedMatching: CastGroupMatching = {
				id: 'matching-123',
				guestId: 'guest-001',
				chatRoomId: null,
				status: 'in_progress',
				proposedDate: new Date().toISOString(),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				totalPoints: 18000,
				startedAt: new Date().toISOString(),
				scheduledEndAt: new Date().toISOString(),
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				recruitingEndedAt: null,
				requestedCastCount: 3,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				type: 'group',
				participantStatus: 'completed',
				guest: {
					id: 'guest-001',
					nickname: 'テストゲスト',
				},
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 0,
					joinedCount: 1,
				},
			}

			mockGroupMatchingService.completeGroupMatching.mockResolvedValue(
				mockUpdatedMatching,
			)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
			expect(body.groupMatching.id).toBe('matching-123')
			expect(body.groupMatching.status).toBe('in_progress')
			expect(body.groupMatching.participantStatus).toBe('completed')

			// サービスが正しいパラメータで呼ばれたことを確認
			expect(
				mockGroupMatchingService.completeGroupMatching,
			).toHaveBeenCalledWith('matching-123', 'cast-123')
		})
	})

	describe('エラーハンドリング', () => {
		it('ユーザーが見つからない場合は404エラーを返す', async () => {
			const app = createTestApp({ id: 'nonexistent-user', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue(null as unknown as User)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(404)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('ユーザーが見つかりません')
		})

		it('サービスがエラーをスローした場合は500エラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.completeGroupMatching.mockRejectedValue(
				new Error('マッチングが見つかりません'),
			)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('予期しないエラーが発生しました')
		})

		it('権限がない場合はエラーを返す', async () => {
			const app = createTestApp({ id: 'cast-123', role: 'cast' })

			mockUserService.findUserById.mockResolvedValue({
				id: 'cast-123',
				email: 'cast@example.com',
				emailVerified: null,
				password: null,
				role: 'cast',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			mockGroupMatchingService.completeGroupMatching.mockRejectedValue(
				new Error('このマッチングを終了する権限がありません'),
			)

			const res = await app.request(
				'/api/group-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
				},
			)

			expect(res.status).toBe(500)
			const body = await res.json()
			expect(body.success).toBe(false)
			expect(body.error).toBe('予期しないエラーが発生しました')
		})
	})
})
