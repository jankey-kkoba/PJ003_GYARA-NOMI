import { z } from 'zod'

/**
 * プロフィール登録リクエストのスキーマ
 */
export const registerProfileSchema = z.object({
	name: z.string().min(1, '名前は必須です'),
	birthDate: z.string().min(1, '生年月日は必須です'),
	userType: z.enum(['guest', 'cast']),
})

/**
 * プロフィール登録リクエストの型
 */
export type RegisterProfileInput = z.infer<typeof registerProfileSchema>
