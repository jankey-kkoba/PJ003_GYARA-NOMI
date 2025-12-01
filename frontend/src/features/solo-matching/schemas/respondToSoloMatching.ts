import { z } from 'zod'

/**
 * ソロマッチング回答リクエストのバリデーションスキーマ
 */
export const respondToSoloMatchingSchema = z.object({
	response: z.enum(['accepted', 'rejected'], {
		message: 'responseは "accepted" または "rejected" である必要があります',
	}),
})

export type RespondToSoloMatchingInput = z.infer<
	typeof respondToSoloMatchingSchema
>
