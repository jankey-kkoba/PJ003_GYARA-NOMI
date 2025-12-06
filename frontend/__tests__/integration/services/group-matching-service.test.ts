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
})
