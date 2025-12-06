import { z } from 'zod'

/**
 * グループマッチング延長リクエストのバリデーションスキーマ
 */
export const extendGroupMatchingSchema = z.object({
	extensionMinutes: z
		.number()
		.int()
		.positive('延長時間は正の整数である必要があります')
		.refine((val) => val % 30 === 0, {
			message: '延長時間は30分単位で指定してください',
		}),
})

export type ExtendGroupMatchingInput = z.infer<typeof extendGroupMatchingSchema>
