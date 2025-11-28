import { z } from 'zod'

/**
 * ソロマッチング延長リクエストのバリデーションスキーマ
 */
export const extendSoloMatchingSchema = z.object({
	extensionMinutes: z
		.number()
		.int()
		.positive('延長時間は正の整数である必要があります')
		.refine((val) => val % 30 === 0, {
			message: '延長時間は30分単位で指定してください',
		}),
})

export type ExtendSoloMatchingInput = z.infer<typeof extendSoloMatchingSchema>
