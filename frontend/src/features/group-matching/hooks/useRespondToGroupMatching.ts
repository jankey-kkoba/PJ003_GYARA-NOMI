import { useMutation, useQueryClient } from '@tanstack/react-query'
import { castGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'
import { parseCastGroupMatching } from '@/features/group-matching/utils/parseGroupMatching'

/**
 * グループマッチング回答のパラメータ
 */
export type RespondToGroupMatchingParams = {
	matchingId: string
	response: 'accepted' | 'rejected'
}

/**
 * グループマッチング回答のカスタムフック
 * キャストがグループマッチングオファーに承認/拒否で回答する
 */
export function useRespondToGroupMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: RespondToGroupMatchingParams,
		): Promise<CastGroupMatching> => {
			const { matchingId, response } = params

			const res = await castGroupMatchingsClient.api['group-matchings'].cast[
				':id'
			].$patch({
				param: { id: matchingId },
				json: { response },
			})

			await handleApiError(res, 'グループマッチングへの回答に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('グループマッチングへの回答に失敗しました')
			}

			return parseCastGroupMatching(result.groupMatching)
		},
		onSuccess: () => {
			// グループマッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castGroupMatchings'] })
		},
	})
}
