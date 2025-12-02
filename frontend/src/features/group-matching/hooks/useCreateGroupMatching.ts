'use client'

import { useMutation } from '@tanstack/react-query'
import { guestGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import { useToast } from '@/hooks/useToast'
import type { CreateGroupMatchingInput } from '@/features/group-matching/schemas/createGroupMatching'
import type { GroupMatching } from '@/features/group-matching/types/groupMatching'
import { parseGroupMatching } from '@/features/group-matching/utils/parseGroupMatching'

/**
 * グループマッチング作成の結果
 */
type CreateGroupMatchingResult = {
	groupMatching: GroupMatching
	participantCount: number
}

/**
 * グループマッチングオファー作成のカスタムフック
 */
export function useCreateGroupMatching() {
	const { showToast } = useToast()

	return useMutation({
		mutationFn: async (
			input: CreateGroupMatchingInput,
		): Promise<CreateGroupMatchingResult> => {
			const res = await guestGroupMatchingsClient.api[
				'group-matchings'
			].guest.$post({
				json: input,
			})

			await handleApiError(
				res,
				'グループマッチングオファーの送信に失敗しました',
			)

			const result = await res.json()

			if (!result.success) {
				throw new Error('グループマッチングオファーの送信に失敗しました')
			}

			return {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				groupMatching: parseGroupMatching(result.groupMatching as any),
				participantCount: result.participantCount,
			}
		},
		onError: (error: Error) => {
			showToast(error.message, 'error')
		},
	})
}
