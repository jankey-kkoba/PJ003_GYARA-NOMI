import { z } from 'zod'

/**
 * キャスト評価作成のバリデーションスキーマ
 */
export const createCastReviewSchema = z.object({
	/** マッチングID */
	matchingId: z.string().min(1, 'マッチングIDは必須です'),
	/** 評価（1-5） */
	rating: z
		.number()
		.int('整数で指定してください')
		.min(1, '評価は1以上で指定してください')
		.max(5, '評価は5以下で指定してください'),
	/** コメント（任意） */
	comment: z
		.string()
		.max(500, 'コメントは500文字以内で入力してください')
		.optional(),
})

export type CreateCastReviewInput = z.infer<typeof createCastReviewSchema>
