import { z } from 'zod'

/**
 * ユーザープロフィール更新スキーマ
 * user_profilesテーブルの更新に使用
 */
export const updateUserProfileSchema = z.object({
	/** ユーザー名 */
	name: z
		.string()
		.min(1, '名前を入力してください')
		.max(100, '名前は100文字以内で入力してください'),
	/** 生年月日（YYYY-MM-DD形式） */
	birthDate: z
		.string()
		.regex(
			/^\d{4}-\d{2}-\d{2}$/,
			'生年月日は YYYY-MM-DD 形式で入力してください',
		),
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
