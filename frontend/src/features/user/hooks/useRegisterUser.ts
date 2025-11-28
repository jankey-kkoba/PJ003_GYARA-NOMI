import { useMutation } from '@tanstack/react-query'
import { usersClient } from '@/libs/hono/client'
import { handleApiResponse } from '@/libs/react-query'

/**
 * プロフィール登録リクエストの入力データ
 */
type RegisterProfileInput = {
	name: string
	birthDate: string
	userType: 'guest' | 'cast'
}

/**
 * プロフィール登録用のmutationフック
 * @returns mutation オブジェクト
 */
export function useRegisterUser() {
	return useMutation({
		mutationFn: async (input: RegisterProfileInput) => {
			const res = await usersClient.api.users.register.$post({
				json: input,
			})

			return handleApiResponse(res, '登録に失敗しました')
		},
	})
}
