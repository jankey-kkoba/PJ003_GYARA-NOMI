import { useMutation } from '@tanstack/react-query'
import { guestSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import { useToast } from '@/hooks/useToast'
import type { CreateSoloMatchingInput } from '@/features/solo-matching/schemas/createSoloMatching'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseSoloMatching } from '@/features/solo-matching/utils/parseSoloMatching'

/**
 * ソロマッチングオファー作成のカスタムフック
 */
export function useCreateSoloMatching() {
	const { showToast } = useToast()

	return useMutation({
		mutationFn: async (
			input: CreateSoloMatchingInput,
		): Promise<SoloMatching> => {
			const res = await guestSoloMatchingsClient.api[
				'solo-matchings'
			].guest.$post({
				json: input,
			})

			await handleApiError(res, 'マッチングオファーの送信に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチングオファーの送信に失敗しました')
			}

			return parseSoloMatching(result.soloMatching)
		},
		onError: (error: Error) => {
			showToast(error.message, 'error')
		},
	})
}
