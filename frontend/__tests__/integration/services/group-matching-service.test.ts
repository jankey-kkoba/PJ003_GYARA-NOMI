/**
 * groupMatchingService Integration テスト
 *
 * ローカルSupabaseを使用してグループマッチングサービスのDB操作を検証
 *
 * 前提条件:
 * - supabase db reset を実行してseed.sqlが適用されていること
 * - seed.sqlで定義されたユーザーデータが存在すること
 *   - seed-user-guest-001: ゲストユーザー
 *   - seed-user-cast-001〜005: キャストユーザー
 *
 * 注意:
 * - テストでグループマッチングを作成する
 * - クリーンアップを実施してテストデータを削除
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { db } from '@/libs/db'
import { matchings, matchingParticipants } from '@/libs/db/schema'
import { groupMatchingService } from '@/features/group-matching/services/groupMatchingService'
import { RANK_HOURLY_RATES } from '@/features/cast/constants'
import { calculatePoints } from '@/utils/points'

// 新規作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-group-matching-service-'

// 新規作成したデータのクリーンアップ
async function cleanupTestData() {
	// LIKE演算子でテストプレフィックスに一致するマッチングを検索して削除
	// 注: matching_participantsはmatchingsにcascade deleteが設定されているので自動的に削除される
	const testMatchings = await db
		.select({ id: matchings.id })
		.from(matchings)
		.where(like(matchings.id, `${TEST_PREFIX}%`))

	for (const { id } of testMatchings) {
		await db.delete(matchings).where(eq(matchings.id, id))
	}

	// type='group'で作成されたマッチングも削除（テスト中に作成されたもの）
	const groupMatchings = await db
		.select({ id: matchings.id })
		.from(matchings)
		.where(eq(matchings.type, 'group'))

	for (const { id } of groupMatchings) {
		await db.delete(matchings).where(eq(matchings.id, id))
	}
}

// マッチングをテストプレフィックス付きIDに更新する（クリーンアップ用）
async function markForCleanup(matchingId: string) {
	// 参加者を全て削除
	await db
		.delete(matchingParticipants)
		.where(eq(matchingParticipants.matchingId, matchingId))

	// マッチングIDを更新
	const newMatchingId = `${TEST_PREFIX}${matchingId}`
	await db
		.update(matchings)
		.set({ id: newMatchingId })
		.where(eq(matchings.id, matchingId))
}

describe('groupMatchingService Integration', () => {
	beforeEach(async () => {
		await cleanupTestData()
	})

	afterEach(async () => {
		await cleanupTestData()
	})

	describe('createGroupMatching', () => {
		it('グループマッチングを作成できる', async () => {
			const proposedDate = new Date(Date.now() + 86400000) // 明日

			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 3,
				proposedDate,
				proposedDuration: 120, // 2時間
				proposedLocation: '渋谷',
			})

			// 戻り値の検証
			expect(result).toBeDefined()
			expect(result.matching.guestId).toBe('seed-user-guest-001')
			expect(result.matching.proposedDuration).toBe(120)
			expect(result.matching.proposedLocation).toBe('渋谷')
			expect(result.matching.requestedCastCount).toBe(3)
			// 合計ポイントはブロンズランクの時給×人数×時間で計算される
			const expectedPoints = calculatePoints(120, RANK_HOURLY_RATES[1]) * 3 // 2時間 × 3000円/時 × 3人 = 18000ポイント
			expect(result.matching.totalPoints).toBe(expectedPoints)
			expect(result.matching.status).toBe('pending')
			expect(result.matching.chatRoomId).toBeNull()
			// 全アクティブキャストにオファーが送信されていることを確認
			expect(result.participantCount).toBeGreaterThan(0)

			// DBに実際に作成されているか検証（matchingsテーブル）
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, result.matching.id))
				.limit(1)

			expect(dbMatching).toBeDefined()
			expect(dbMatching.guestId).toBe('seed-user-guest-001')
			expect(dbMatching.type).toBe('group')
			expect(dbMatching.requestedCastCount).toBe(3)
			expect(dbMatching.totalPoints).toBe(expectedPoints)

			// DBに実際に作成されているか検証（matching_participantsテーブル）
			const dbParticipants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, result.matching.id))

			// 全アクティブキャストにオファーが送信されていることを確認
			expect(dbParticipants.length).toBe(result.participantCount)
			// 全参加者のステータスがpendingであることを確認
			dbParticipants.forEach((participant) => {
				expect(participant.status).toBe('pending')
			})

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		it('合計ポイントが正しく計算される（30分の場合）', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 30, // 30分
				proposedLocation: '新宿',
			})

			// 30分 = 0.5時間 → 0.5 × 3000（ブロンズランクの時給） × 2人 = 3000ポイント
			const expectedPoints = calculatePoints(30, RANK_HOURLY_RATES[1]) * 2
			expect(result.matching.totalPoints).toBe(expectedPoints)

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		it('合計ポイントが正しく計算される（3時間30分、5人の場合）', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 5,
				proposedDate,
				proposedDuration: 210, // 3時間30分
				proposedLocation: '池袋',
			})

			// 3.5時間 × 3000（ブロンズランクの時給） × 5人 = 52500ポイント
			const expectedPoints = calculatePoints(210, RANK_HOURLY_RATES[1]) * 5
			expect(result.matching.totalPoints).toBe(expectedPoints)

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		it('相対時間指定でグループマッチングを作成できる', async () => {
			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedTimeOffsetMinutes: 60, // 1時間後
				proposedDuration: 120, // 2時間
				proposedLocation: '六本木',
			})

			// 戻り値の検証
			expect(result).toBeDefined()
			expect(result.matching.guestId).toBe('seed-user-guest-001')
			expect(result.matching.proposedDuration).toBe(120)
			expect(result.matching.proposedLocation).toBe('六本木')
			expect(result.matching.requestedCastCount).toBe(2)

			// proposedDateが設定されていることを確認
			expect(result.matching.proposedDate).toBeDefined()
			expect(result.matching.proposedDate instanceof Date).toBe(true)

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		// 注: proposedDateとproposedTimeOffsetMinutesの必須バリデーションはスキーマ（API層）で行われる
		// そのため、サービス層の直接呼び出しではチェックされない
	})

	describe('getGuestGroupMatchings', () => {
		it('ゲストのグループマッチング一覧を取得できる', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000) // 明日

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 一覧を取得
			const matchingList = await groupMatchingService.getGuestGroupMatchings(
				'seed-user-guest-001',
			)

			// 作成したマッチングが一覧に含まれていることを確認
			expect(matchingList.length).toBeGreaterThanOrEqual(1)
			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeDefined()
			expect(foundMatching!.guestId).toBe('seed-user-guest-001')
			expect(foundMatching!.type).toBe('group')
			expect(foundMatching!.participantSummary).toBeDefined()
			expect(foundMatching!.participantSummary.pendingCount).toBeGreaterThan(0)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('他のゲストのグループマッチングは取得されない', async () => {
			// ゲスト1でマッチング作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 存在しないゲストIDで取得（空の配列が返る）
			const matchingList =
				await groupMatchingService.getGuestGroupMatchings('non-existent-guest')

			expect(matchingList.length).toBe(0)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('completedステータスのマッチングは一覧に含まれない', async () => {
			// テスト用のグループマッチングを作成してステータスをcompletedに変更
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// ステータスをcompletedに変更
			await db
				.update(matchings)
				.set({ status: 'completed' })
				.where(eq(matchings.id, createResult.matching.id))

			// 一覧を取得
			const matchingList = await groupMatchingService.getGuestGroupMatchings(
				'seed-user-guest-001',
			)

			// completedのマッチングは含まれない
			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeUndefined()

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('参加者サマリーが正しく計算される', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 一人の参加者のステータスをacceptedに変更
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			if (participants.length > 0) {
				await db
					.update(matchingParticipants)
					.set({ status: 'accepted' })
					.where(eq(matchingParticipants.id, participants[0].id))
			}

			// 一覧を取得
			const matchingList = await groupMatchingService.getGuestGroupMatchings(
				'seed-user-guest-001',
			)

			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeDefined()
			expect(foundMatching!.participantSummary.acceptedCount).toBe(1)
			expect(foundMatching!.participantSummary.pendingCount).toBe(
				participants.length - 1,
			)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})
	})

	describe('getCastGroupMatchings', () => {
		it('キャストのグループマッチング一覧を取得できる', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000) // 明日

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者として登録されているキャストを取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// キャスト側から一覧を取得
			const matchingList =
				await groupMatchingService.getCastGroupMatchings(castId)

			// 作成したマッチングが一覧に含まれていることを確認
			expect(matchingList.length).toBeGreaterThanOrEqual(1)
			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeDefined()
			expect(foundMatching!.type).toBe('group')
			expect(foundMatching!.participantStatus).toBe('pending')
			expect(foundMatching!.guest).toBeDefined()
			expect(foundMatching!.guest.id).toBe('seed-user-guest-001')
			expect(foundMatching!.participantSummary).toBeDefined()
			expect(foundMatching!.participantSummary.requestedCount).toBe(2)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('他のキャストのグループマッチングは取得されない', async () => {
			// 存在しないキャストIDで取得（空の配列が返る）
			const matchingList =
				await groupMatchingService.getCastGroupMatchings('non-existent-cast')

			expect(matchingList.length).toBe(0)
		})

		it('参加ステータスがrejectedのマッチングは一覧に含まれない', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// ステータスをrejectedに変更
			await db
				.update(matchingParticipants)
				.set({ status: 'rejected' })
				.where(eq(matchingParticipants.id, participants[0].id))

			// 一覧を取得
			const matchingList =
				await groupMatchingService.getCastGroupMatchings(castId)

			// rejectedのマッチングは含まれない
			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeUndefined()

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('参加ステータスがacceptedのマッチングは一覧に含まれる', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// ステータスをacceptedに変更
			await db
				.update(matchingParticipants)
				.set({ status: 'accepted' })
				.where(eq(matchingParticipants.id, participants[0].id))

			// 一覧を取得
			const matchingList =
				await groupMatchingService.getCastGroupMatchings(castId)

			// acceptedのマッチングは含まれる
			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeDefined()
			expect(foundMatching!.participantStatus).toBe('accepted')

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('参加者サマリーが正しく計算される', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 3,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(1)
			const castId = participants[0].castId

			// 2人をacceptedに変更
			if (participants.length > 1) {
				await db
					.update(matchingParticipants)
					.set({ status: 'accepted' })
					.where(eq(matchingParticipants.id, participants[0].id))
				await db
					.update(matchingParticipants)
					.set({ status: 'accepted' })
					.where(eq(matchingParticipants.id, participants[1].id))
			}

			// 一覧を取得
			const matchingList =
				await groupMatchingService.getCastGroupMatchings(castId)

			const foundMatching = matchingList.find(
				(m) => m.id === createResult.matching.id,
			)
			expect(foundMatching).toBeDefined()
			expect(foundMatching!.participantSummary.requestedCount).toBe(3)
			expect(foundMatching!.participantSummary.acceptedCount).toBe(2)
			expect(foundMatching!.participantSummary.joinedCount).toBe(0)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})
	})

	describe('createGroupMatching - 年齢フィルタリング', () => {
		it('minAgeを指定すると、その年齢以上のキャストのみにオファーが送信される', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				minAge: 27, // 27歳以上（1997年以前生まれ）
			})

			// オファーが送信されていることを確認
			expect(result.participantCount).toBeGreaterThan(0)

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		it('maxAgeを指定すると、その年齢以下のキャストのみにオファーが送信される', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				maxAge: 25, // 25歳以下（1999年以降生まれ）
			})

			// オファーが送信されていることを確認
			expect(result.participantCount).toBeGreaterThan(0)

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		it('minAgeとmaxAgeを両方指定すると、その範囲内のキャストのみにオファーが送信される', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				minAge: 25,
				maxAge: 27, // 25〜27歳
			})

			// オファーが送信されていることを確認
			expect(result.participantCount).toBeGreaterThan(0)

			// クリーンアップ
			await markForCleanup(result.matching.id)
		})

		it('条件に合うキャストがいない場合はエラー', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			// 99歳以上というありえない条件
			await expect(
				groupMatchingService.createGroupMatching({
					guestId: 'seed-user-guest-001',
					requestedCastCount: 2,
					proposedDate,
					proposedDuration: 120,
					proposedLocation: '渋谷',
					minAge: 99,
					maxAge: 99,
				}),
			).rejects.toThrow('アクティブなキャストが見つかりません')
		})
	})

	describe('respondToGroupMatching', () => {
		it('キャストがグループマッチングにacceptedで回答できる', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// acceptedで回答
			const result = await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId,
				'accepted',
			)

			// 戻り値の検証
			expect(result).toBeDefined()
			expect(result.participantStatus).toBe('accepted')
			expect(result.id).toBe(createResult.matching.id)
			expect(result.guest.id).toBe('seed-user-guest-001')

			// DBの参加者ステータスが更新されていることを確認
			const [updatedParticipant] = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.id, participants[0].id))

			expect(updatedParticipant.status).toBe('accepted')
			expect(updatedParticipant.respondedAt).not.toBeNull()

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('キャストがグループマッチングにrejectedで回答できる', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// rejectedで回答
			const result = await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId,
				'rejected',
			)

			// 戻り値の検証
			expect(result).toBeDefined()
			expect(result.participantStatus).toBe('rejected')

			// DBの参加者ステータスが更新されていることを確認
			const [updatedParticipant] = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.id, participants[0].id))

			expect(updatedParticipant.status).toBe('rejected')
			expect(updatedParticipant.respondedAt).not.toBeNull()

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('存在しないマッチングに回答するとエラー', async () => {
			await expect(
				groupMatchingService.respondToGroupMatching(
					'non-existent-matching-id',
					'seed-user-cast-001',
					'accepted',
				),
			).rejects.toThrow('マッチングが見つかりません')
		})

		it('対象キャストでないユーザーが回答するとエラー', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 存在しないキャストIDで回答
			await expect(
				groupMatchingService.respondToGroupMatching(
					createResult.matching.id,
					'non-existent-cast-id',
					'accepted',
				),
			).rejects.toThrow('マッチングが見つかりません')

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('既に回答済みのオファーに再度回答するとエラー', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// 1回目の回答
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId,
				'accepted',
			)

			// 2回目の回答はエラー
			await expect(
				groupMatchingService.respondToGroupMatching(
					createResult.matching.id,
					castId,
					'rejected',
				),
			).rejects.toThrow('このオファーは既に回答済みです')

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('締め切られたマッチングに回答するとエラー', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// マッチングのステータスをaccepted（成立）に変更
			await db
				.update(matchings)
				.set({ status: 'accepted' })
				.where(eq(matchings.id, createResult.matching.id))

			// 回答するとエラー
			await expect(
				groupMatchingService.respondToGroupMatching(
					createResult.matching.id,
					castId,
					'accepted',
				),
			).rejects.toThrow('このマッチングは既に締め切られています')

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('参加者サマリーが正しく返される', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 3,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// acceptedで回答
			const result = await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId,
				'accepted',
			)

			// 参加者サマリーの検証
			expect(result.participantSummary).toBeDefined()
			expect(result.participantSummary.requestedCount).toBe(3)
			expect(result.participantSummary.acceptedCount).toBe(1) // 今回答したキャスト
			expect(result.participantSummary.joinedCount).toBe(0)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})
	})

	describe('startGroupMatching', () => {
		it('キャストがグループマッチングを開始できる（合流）', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// まずacceptedで回答
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId,
				'accepted',
			)

			// マッチング全体をacceptedに変更（募集完了）
			await db
				.update(matchings)
				.set({ status: 'accepted' })
				.where(eq(matchings.id, createResult.matching.id))

			// マッチングを開始（合流）
			const result = await groupMatchingService.startGroupMatching(
				createResult.matching.id,
				castId,
			)

			// 戻り値の検証
			expect(result).toBeDefined()
			expect(result.participantStatus).toBe('joined')
			expect(result.status).toBe('in_progress')
			expect(result.startedAt).not.toBeNull()
			expect(result.scheduledEndAt).not.toBeNull()

			// DBの参加者ステータスが更新されていることを確認
			const [updatedParticipant] = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.id, participants[0].id))

			expect(updatedParticipant.status).toBe('joined')
			expect(updatedParticipant.joinedAt).not.toBeNull()

			// DBのマッチングステータスが更新されていることを確認
			const [updatedMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, createResult.matching.id))

			expect(updatedMatching.status).toBe('in_progress')
			expect(updatedMatching.startedAt).not.toBeNull()
			expect(updatedMatching.scheduledEndAt).not.toBeNull()

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('2人目のキャストが合流してもマッチングのステータスは変わらない', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 3,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(1)
			const castId1 = participants[0].castId
			const castId2 = participants[1].castId

			// 両方ともacceptedで回答
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId1,
				'accepted',
			)
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId2,
				'accepted',
			)

			// マッチング全体をacceptedに変更（募集完了）
			await db
				.update(matchings)
				.set({ status: 'accepted' })
				.where(eq(matchings.id, createResult.matching.id))

			// 1人目が合流
			const result1 = await groupMatchingService.startGroupMatching(
				createResult.matching.id,
				castId1,
			)

			expect(result1.status).toBe('in_progress')
			const startedAt1 = result1.startedAt
			const scheduledEndAt1 = result1.scheduledEndAt

			// 2人目が合流
			const result2 = await groupMatchingService.startGroupMatching(
				createResult.matching.id,
				castId2,
			)

			// 2人目もjoinedになる
			expect(result2.participantStatus).toBe('joined')
			// マッチングのステータスと開始時刻は変わらない
			expect(result2.status).toBe('in_progress')
			expect(result2.startedAt?.getTime()).toBe(startedAt1?.getTime())
			expect(result2.scheduledEndAt?.getTime()).toBe(scheduledEndAt1?.getTime())

			// 参加者サマリーのjoinedCountが2になる
			expect(result2.participantSummary.joinedCount).toBe(2)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('存在しないマッチングを開始するとエラー', async () => {
			await expect(
				groupMatchingService.startGroupMatching(
					'non-existent-matching-id',
					'seed-user-cast-001',
				),
			).rejects.toThrow('マッチングが見つかりません')
		})

		it('参加者でないキャストが開始しようとするとエラー', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// マッチング全体をacceptedに変更
			await db
				.update(matchings)
				.set({ status: 'accepted' })
				.where(eq(matchings.id, createResult.matching.id))

			// 存在しないキャストIDで開始
			await expect(
				groupMatchingService.startGroupMatching(
					createResult.matching.id,
					'non-existent-cast-id',
				),
			).rejects.toThrow('マッチングが見つかりません')

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('pendingステータスのキャストが開始しようとするとエラー', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// マッチング全体をacceptedに変更（キャストはまだpending）
			await db
				.update(matchings)
				.set({ status: 'accepted' })
				.where(eq(matchings.id, createResult.matching.id))

			// pendingのキャストが開始しようとするとエラー
			await expect(
				groupMatchingService.startGroupMatching(
					createResult.matching.id,
					castId,
				),
			).rejects.toThrow('このマッチングに合流する権限がありません')

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('pendingステータスのマッチングを開始しようとするとエラー', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 2,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(0)
			const castId = participants[0].castId

			// acceptedで回答（キャストはaccepted）
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId,
				'accepted',
			)

			// マッチング全体がまだpendingのまま開始しようとするとエラー
			await expect(
				groupMatchingService.startGroupMatching(
					createResult.matching.id,
					castId,
				),
			).rejects.toThrow(
				'このマッチングは開始できません（成立済みマッチングのみ開始可能です）',
			)

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})

		it('参加者サマリーが正しく返される', async () => {
			// テスト用のグループマッチングを作成
			const proposedDate = new Date(Date.now() + 86400000)

			const createResult = await groupMatchingService.createGroupMatching({
				guestId: 'seed-user-guest-001',
				requestedCastCount: 3,
				proposedDate,
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 参加者を取得
			const participants = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, createResult.matching.id))

			expect(participants.length).toBeGreaterThan(1)
			const castId1 = participants[0].castId
			const castId2 = participants[1].castId

			// 2人ともacceptedで回答
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId1,
				'accepted',
			)
			await groupMatchingService.respondToGroupMatching(
				createResult.matching.id,
				castId2,
				'accepted',
			)

			// マッチング全体をacceptedに変更
			await db
				.update(matchings)
				.set({ status: 'accepted' })
				.where(eq(matchings.id, createResult.matching.id))

			// 1人目が合流
			const result = await groupMatchingService.startGroupMatching(
				createResult.matching.id,
				castId1,
			)

			// 参加者サマリーの検証
			expect(result.participantSummary).toBeDefined()
			expect(result.participantSummary.requestedCount).toBe(3)
			expect(result.participantSummary.acceptedCount).toBe(1) // 2人目がまだaccepted
			expect(result.participantSummary.joinedCount).toBe(1) // 1人目がjoined

			// クリーンアップ
			await markForCleanup(createResult.matching.id)
		})
	})
})
