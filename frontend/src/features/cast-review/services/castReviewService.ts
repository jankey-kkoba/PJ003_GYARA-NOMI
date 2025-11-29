import { eq } from 'drizzle-orm'
import { db } from '@/libs/db'
import { castReviews } from '@/libs/db/schema/cast-reviews'
import { soloMatchings } from '@/libs/db/schema/solo-matchings'
import type { CastReview } from '@/features/cast-review/types/castReview'

/**
 * キャスト評価サービス
 * キャスト評価関連のデータベース操作を提供
 */
export const castReviewService = {
	/**
	 * 評価を作成
	 * @param guestId - ゲストID
	 * @param matchingId - マッチングID
	 * @param rating - 評価（1-5）
	 * @param comment - コメント（任意）
	 * @returns 作成された評価
	 */
	async createReview(
		guestId: string,
		matchingId: string,
		rating: number,
		comment?: string,
	): Promise<CastReview> {
		// マッチング情報を取得
		const [matching] = await db
			.select()
			.from(soloMatchings)
			.where(eq(soloMatchings.id, matchingId))

		if (!matching) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: ゲストIDが一致するか
		if (matching.guestId !== guestId) {
			throw new Error('このマッチングを評価する権限がありません')
		}

		// ステータスチェック: completedのみ評価可能
		if (matching.status !== 'completed') {
			throw new Error('完了したマッチングのみ評価できます')
		}

		// 既に評価済みでないかチェック
		const [existingReview] = await db
			.select()
			.from(castReviews)
			.where(eq(castReviews.matchingId, matchingId))
			.limit(1)

		if (existingReview) {
			throw new Error('このマッチングは既に評価済みです')
		}

		// 評価を作成
		const [result] = await db
			.insert(castReviews)
			.values({
				matchingId,
				guestId,
				castId: matching.castId,
				rating,
				comment: comment ?? null,
			})
			.returning()

		return {
			id: result.id,
			matchingId: result.matchingId,
			guestId: result.guestId,
			castId: result.castId,
			rating: result.rating,
			comment: result.comment,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		}
	},

	/**
	 * マッチングIDで評価を取得
	 * @param matchingId - マッチングID
	 * @returns 評価（存在しない場合はnull）
	 */
	async getReviewByMatchingId(matchingId: string): Promise<CastReview | null> {
		const [result] = await db
			.select()
			.from(castReviews)
			.where(eq(castReviews.matchingId, matchingId))
			.limit(1)

		if (!result) {
			return null
		}

		return {
			id: result.id,
			matchingId: result.matchingId,
			guestId: result.guestId,
			castId: result.castId,
			rating: result.rating,
			comment: result.comment,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		}
	},

	/**
	 * マッチングが評価済みかチェック
	 * @param matchingId - マッチングID
	 * @returns 評価済みかどうか
	 */
	async hasReview(matchingId: string): Promise<boolean> {
		const [result] = await db
			.select()
			.from(castReviews)
			.where(eq(castReviews.matchingId, matchingId))
			.limit(1)

		return !!result
	},
}
