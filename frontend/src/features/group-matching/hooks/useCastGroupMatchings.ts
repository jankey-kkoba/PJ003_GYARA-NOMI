import { useQuery } from '@tanstack/react-query'
import { castGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'

/**
 * キャストのグループマッチング一覧を取得するhook
 */
export function useCastGroupMatchings() {
	return useQuery({
		queryKey: ['castGroupMatchings'],
		queryFn: async (): Promise<CastGroupMatching[]> => {
			const res =
				await castGroupMatchingsClient.api['group-matchings'].cast.$get()

			await handleApiError(res, 'グループマッチング一覧の取得に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('グループマッチング一覧の取得に失敗しました')
			}

			return result.groupMatchings
		},
	})
}
