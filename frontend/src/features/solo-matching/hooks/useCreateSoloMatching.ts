import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import type { CreateSoloMatchingInput } from '@/features/solo-matching/schemas/createSoloMatching'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * APIレスポンスの型
 */
type CreateSoloMatchingResponse = {
	success: true
	soloMatching: SoloMatching
}

/**
 * ソロマッチングオファーを作成
 */
async function createSoloMatching(
	input: CreateSoloMatchingInput,
): Promise<SoloMatching> {
	const response = await fetch('/api/solo-matchings/guest', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(input),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || 'マッチングオファーの送信に失敗しました')
	}

	const data: CreateSoloMatchingResponse = await response.json()
	return data.soloMatching
}

/**
 * ソロマッチングオファー作成のカスタムフック
 */
export function useCreateSoloMatching() {
	const { showToast } = useToast()

	return useMutation({
		mutationFn: createSoloMatching,
		onError: (error: Error) => {
			showToast(error.message, 'error')
		},
	})
}
