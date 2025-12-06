/**
 * キャスト評価
 */
export type CastReview = {
	id: string
	matchingId: string
	guestId: string
	castId: string
	rating: number // 1-5
	comment: string | null
	createdAt: string
	updatedAt: string
}

/**
 * キャスト評価作成用パラメータ
 */
export type CreateCastReviewParams = {
	matchingId: string
	rating: number
	comment?: string
}
