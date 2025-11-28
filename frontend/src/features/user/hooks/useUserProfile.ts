import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersClient } from '@/libs/hono/client'
import { handleApiResponse } from '@/libs/react-query'
import type { UpdateUserProfileInput } from '@/features/user/schemas/updateUserProfile'

/**
 * ユーザープロフィール型
 */
type UserProfile = {
	id: string
	name: string
	birthDate: string
	createdAt: Date
	updatedAt: Date
}

/**
 * ユーザープロフィールAPI レスポンス型
 */
type UserProfileResponse = {
	success: boolean
	profile: UserProfile
}

/**
 * ユーザープロフィール取得用のqueryフック
 */
export function useUserProfile() {
	return useQuery({
		queryKey: ['user', 'profile'],
		queryFn: async () => {
			const res = await usersClient.api.users.profile.$get()
			const data = await handleApiResponse<UserProfileResponse>(
				res,
				'プロフィールの取得に失敗しました',
			)
			return data.profile
		},
	})
}

/**
 * ユーザープロフィール更新用のmutationフック
 */
export function useUpdateUserProfile() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: UpdateUserProfileInput) => {
			const res = await usersClient.api.users.profile.$put({
				json: input,
			})

			return handleApiResponse(res, 'プロフィールの更新に失敗しました')
		},
		onSuccess: () => {
			// プロフィール情報を再取得
			queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
		},
	})
}
