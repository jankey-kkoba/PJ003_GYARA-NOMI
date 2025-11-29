import { useQuery } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseDate, parseNullableDate } from '@/utils/date'

/**
 * APIレスポンスの型
 */
type CompletedSoloMatchingsResponse = {
	success: true
	soloMatchings: SoloMatching[]
}

/**
 * 完了済みソロマッチング一覧を取得
 */
async function fetchCompletedSoloMatchings(): Promise<SoloMatching[]> {
	const response = await fetch('/api/solo-matchings/guest/completed')

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || '完了済みマッチング一覧の取得に失敗しました')
	}

	const data: CompletedSoloMatchingsResponse = await response.json()

	// 日付文字列をDateオブジェクトに変換
	return data.soloMatchings.map((matching) => ({
		...matching,
		proposedDate: parseDate(matching.proposedDate as unknown as string),
		startedAt: parseNullableDate(matching.startedAt as unknown as string),
		scheduledEndAt: parseNullableDate(
			matching.scheduledEndAt as unknown as string,
		),
		actualEndAt: parseNullableDate(matching.actualEndAt as unknown as string),
		castRespondedAt: parseNullableDate(
			matching.castRespondedAt as unknown as string,
		),
		createdAt: parseDate(matching.createdAt as unknown as string),
		updatedAt: parseDate(matching.updatedAt as unknown as string),
	}))
}

/**
 * 完了済みソロマッチング一覧取得のカスタムフック
 */
export function useCompletedSoloMatchings() {
	return useQuery({
		queryKey: ['completedSoloMatchings'],
		queryFn: fetchCompletedSoloMatchings,
	})
}
