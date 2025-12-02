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

		it('proposedDateもproposedTimeOffsetMinutesも指定しない場合はエラー', async () => {
			await expect(
				groupMatchingService.createGroupMatching({
					guestId: 'seed-user-guest-001',
					requestedCastCount: 2,
					// proposedDateもproposedTimeOffsetMinutesも指定しない
					proposedDuration: 120,
					proposedLocation: '渋谷',
				}),
			).rejects.toThrow(
				'proposedDate または proposedTimeOffsetMinutes のいずれかを指定してください',
			)
		})
	})
})
