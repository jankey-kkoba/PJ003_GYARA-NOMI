/**
 * castReviewService Integration テスト
 *
 * ローカルSupabaseを使用してキャスト評価サービスのDB操作を検証
 *
 * 前提条件:
 * - supabase db reset を実行してseed.sqlが適用されていること
 * - seed.sqlで定義されたデータが存在すること
 *   - seed-user-guest-001: ゲストユーザー
 *   - seed-user-cast-001: キャストユーザー
 *   - seed-matching-completed-001: 完了済みマッチング
 *   - seed-matching-completed-002: 完了済みマッチング（評価済みテスト用）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { db } from '@/libs/db'
import { castReviews } from '@/libs/db/schema/cast-reviews'
import { castReviewService } from '@/features/cast-review/services/castReviewService'

// テストで使用するシードデータのID
const GUEST_ID = 'seed-user-guest-001'
const CAST_ID_1 = 'seed-user-cast-001'
const CAST_ID_2 = 'seed-user-cast-002'
const COMPLETED_MATCHING_ID_1 = 'seed-matching-completed-001'
const COMPLETED_MATCHING_ID_2 = 'seed-matching-completed-002'
const PENDING_MATCHING_ID = 'seed-matching-pending-001'

// テスト作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-cast-review-service-'

// テストデータのクリーンアップ
async function cleanupTestData() {
	// テストプレフィックスに一致する評価を削除
	const testReviews = await db
		.select({ id: castReviews.id })
		.from(castReviews)
		.where(like(castReviews.id, `${TEST_PREFIX}%`))

	for (const { id } of testReviews) {
		await db.delete(castReviews).where(eq(castReviews.id, id))
	}

	// シードマッチングに対する評価も削除（テストで作成されたもの）
	await db
		.delete(castReviews)
		.where(eq(castReviews.matchingId, COMPLETED_MATCHING_ID_1))
	await db
		.delete(castReviews)
		.where(eq(castReviews.matchingId, COMPLETED_MATCHING_ID_2))
}

describe('castReviewService Integration', () => {
	beforeEach(async () => {
		await cleanupTestData()
	})

	afterEach(async () => {
		await cleanupTestData()
	})

	describe('createReview', () => {
		it('完了済みマッチングに対して評価を作成できる', async () => {
			const result = await castReviewService.createReview(
				GUEST_ID,
				COMPLETED_MATCHING_ID_1,
				5,
				'とても楽しい時間でした',
			)

			expect(result).toBeDefined()
			expect(result.matchingId).toBe(COMPLETED_MATCHING_ID_1)
			expect(result.guestId).toBe(GUEST_ID)
			expect(result.castId).toBe(CAST_ID_1)
			expect(result.rating).toBe(5)
			expect(result.comment).toBe('とても楽しい時間でした')

			// DBに実際に作成されているか検証
			const dbRecord = await db
				.select()
				.from(castReviews)
				.where(eq(castReviews.id, result.id))
				.limit(1)

			expect(dbRecord).toHaveLength(1)
			expect(dbRecord[0].rating).toBe(5)
		})

		it('コメントなしで評価を作成できる', async () => {
			const result = await castReviewService.createReview(
				GUEST_ID,
				COMPLETED_MATCHING_ID_1,
				4,
			)

			expect(result).toBeDefined()
			expect(result.rating).toBe(4)
			expect(result.comment).toBeNull()
		})

		it('未完了マッチングには評価を作成できない', async () => {
			await expect(
				castReviewService.createReview(GUEST_ID, PENDING_MATCHING_ID, 5),
			).rejects.toThrow('完了したマッチングのみ評価できます')
		})

		it('他のゲストのマッチングには評価を作成できない', async () => {
			// seed-user-guest-002はこのマッチングのゲストではない
			await expect(
				castReviewService.createReview(
					'seed-user-guest-002',
					COMPLETED_MATCHING_ID_1,
					5,
				),
			).rejects.toThrow('このマッチングを評価する権限がありません')
		})

		it('既に評価済みのマッチングには再度評価できない', async () => {
			// 最初の評価
			await castReviewService.createReview(GUEST_ID, COMPLETED_MATCHING_ID_1, 5)

			// 2回目の評価はエラー
			await expect(
				castReviewService.createReview(GUEST_ID, COMPLETED_MATCHING_ID_1, 3),
			).rejects.toThrow('このマッチングは既に評価済みです')
		})

		it('存在しないマッチングには評価を作成できない', async () => {
			await expect(
				castReviewService.createReview(GUEST_ID, 'non-existent-matching-id', 5),
			).rejects.toThrow('マッチングが見つかりません')
		})
	})

	describe('getReviewByMatchingId', () => {
		it('評価を取得できる', async () => {
			// 評価を作成
			await castReviewService.createReview(
				GUEST_ID,
				COMPLETED_MATCHING_ID_1,
				4,
				'良かったです',
			)

			const result = await castReviewService.getReviewByMatchingId(
				COMPLETED_MATCHING_ID_1,
			)

			expect(result).not.toBeNull()
			expect(result?.matchingId).toBe(COMPLETED_MATCHING_ID_1)
			expect(result?.rating).toBe(4)
			expect(result?.comment).toBe('良かったです')
		})

		it('評価が存在しない場合はnullを返す', async () => {
			const result = await castReviewService.getReviewByMatchingId(
				COMPLETED_MATCHING_ID_1,
			)

			expect(result).toBeNull()
		})
	})

	describe('hasReview', () => {
		it('評価済みの場合はtrueを返す', async () => {
			await castReviewService.createReview(GUEST_ID, COMPLETED_MATCHING_ID_1, 5)

			const result = await castReviewService.hasReview(COMPLETED_MATCHING_ID_1)

			expect(result).toBe(true)
		})

		it('未評価の場合はfalseを返す', async () => {
			const result = await castReviewService.hasReview(COMPLETED_MATCHING_ID_1)

			expect(result).toBe(false)
		})
	})
})
