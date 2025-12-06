import { useMutation, useQueryClient } from '@tanstack/react-query'
import { castGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'

/**
 * グループマッチング開始のパラメータ
 */
export type StartGroupMatchingParams = {
	matchingId: string
}

/**
 * グループマッチング開始のカスタムフック
 * キャストが「合流」ボタンを押してギャラ飲みを開始する
 */
export function useStartGroupMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: StartGroupMatchingParams,
		): Promise<CastGroupMatching> => {
			const { matchingId } = params

			const res = await castGroupMatchingsClient.api['group-matchings'].cast[
				':id'
			].start.$patch({
				param: { id: matchingId },
			})

			await handleApiError(res, 'グループマッチングの開始に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('グループマッチングの開始に失敗しました')
			}

			return result.groupMatching
		},
		onSuccess: () => {
			// グループマッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castGroupMatchings'] })
		},
	})
}
