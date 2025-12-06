import { useQuery } from '@tanstack/react-query'
import { guestGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'

/**
 * ゲストのグループマッチング一覧取得のカスタムフック
 */
export function useGuestGroupMatchings() {
	return useQuery({
		queryKey: ['guestGroupMatchings'],
		queryFn: async (): Promise<GuestGroupMatching[]> => {
			const res =
				await guestGroupMatchingsClient.api['group-matchings'].guest.$get()

			await handleApiError(res, 'グループマッチング一覧の取得に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('グループマッチング一覧の取得に失敗しました')
			}

			return result.groupMatchings
		},
	})
}
