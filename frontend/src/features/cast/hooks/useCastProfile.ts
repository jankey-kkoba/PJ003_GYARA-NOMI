import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { castsClient } from '@/libs/hono/client'
import { handleApiResponse } from '@/libs/react-query'
import type { UpdateCastProfileInput } from '@/features/cast/schemas/updateCastProfile'

/**
 * キャストプロフィール型
 */
type CastProfile = {
	id: string
	bio: string | null
	rank: number
	areaId: string | null
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

/**
 * キャストプロフィールAPIレスポンス型
 */
type CastProfileResponse = {
	success: boolean
	profile: CastProfile
}

/**
 * 自分のキャストプロフィール取得用のqueryフック
 */
export function useOwnCastProfile() {
	return useQuery({
		queryKey: ['cast', 'profile', 'own'],
		queryFn: async () => {
			const res = await castsClient.api.casts.profile.$get()
			const data = await handleApiResponse<CastProfileResponse>(
				res,
				'プロフィールの取得に失敗しました',
			)
			return data.profile
		},
	})
}

/**
 * キャストプロフィール更新用のmutationフック
 */
export function useUpdateCastProfile() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: UpdateCastProfileInput) => {
			const res = await castsClient.api.casts.profile.$put({
				json: input,
			})

			return handleApiResponse(res, 'プロフィールの更新に失敗しました')
		},
		onSuccess: () => {
			// プロフィール情報を再取得
			queryClient.invalidateQueries({ queryKey: ['cast', 'profile', 'own'] })
		},
	})
}
