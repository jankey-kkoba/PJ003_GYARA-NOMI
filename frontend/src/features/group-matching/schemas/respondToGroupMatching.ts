import { z } from 'zod'

/**
 * グループマッチング回答リクエストのバリデーションスキーマ
 */
export const respondToGroupMatchingSchema = z.object({
	response: z.enum(['accepted', 'rejected'], {
		message: 'responseは "accepted" または "rejected" である必要があります',
	}),
})

export type RespondToGroupMatchingInput = z.infer<
	typeof respondToGroupMatchingSchema
>
