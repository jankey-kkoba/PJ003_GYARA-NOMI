import { z } from 'zod'

/**
 * ソロマッチングオファー作成のバリデーションスキーマ
 * 時給（hourlyRate）はサーバー側でキャストのランクから自動計算されるため、クライアントからは送信不要
 */
export const createSoloMatchingSchema = z
	.object({
		/** キャストID */
		castId: z.string().min(1, 'キャストIDは必須です'),
		/** 提案日時（ISO8601形式） - カスタム日時指定時に使用 */
		proposedDate: z
			.string()
			.datetime({ message: '有効な日時を指定してください' })
			.optional(),
		/** 相対時間指定（分） - 「60」なら1時間後を意味する */
		proposedTimeOffsetMinutes: z
			.number()
			.int('整数で指定してください')
			.positive('正の数を指定してください')
			.optional(),
		/** 提案時間（分） */
		proposedDuration: z
			.number()
			.int('整数で指定してください')
			.min(30, '最低30分から指定できます')
			.max(480, '最大8時間まで指定できます'),
		/** 提案場所 */
		proposedLocation: z
			.string()
			.min(1, '場所は必須です')
			.max(200, '場所は200文字以内で入力してください'),
	})
	.refine((data) => data.proposedDate || data.proposedTimeOffsetMinutes, {
		message: '開始日時または相対時間指定のいずれかを指定してください',
		path: ['proposedDate'],
	})
	.refine(
		(data) => {
			// proposedDateが指定されている場合は、過去の日時でないことを確認
			if (data.proposedDate) {
				const proposedDate = new Date(data.proposedDate)
				return proposedDate > new Date()
			}
			// proposedTimeOffsetMinutesの場合はサーバー側で計算されるので常にOK
			return true
		},
		{
			message: '過去の日時は指定できません',
			path: ['proposedDate'],
		},
	)

export type CreateSoloMatchingInput = z.infer<typeof createSoloMatchingSchema>
