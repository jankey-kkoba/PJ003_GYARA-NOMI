import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * マッチング開始のパラメータ
 */
export type StartSoloMatchingParams = {
  matchingId: string
}

/**
 * APIレスポンスの型
 */
type StartSoloMatchingResponse = {
  success: true
  matching: SoloMatching
}

/**
 * マッチングを開始する
 */
async function startSoloMatching(params: StartSoloMatchingParams): Promise<SoloMatching> {
  const { matchingId } = params

  const apiResponse = await fetch(`/api/solo-matchings/cast/${matchingId}/start`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!apiResponse.ok) {
    const error = await apiResponse.json()
    throw new Error(error.error || 'マッチングの開始に失敗しました')
  }

  const data: StartSoloMatchingResponse = await apiResponse.json()
  return data.matching
}

/**
 * マッチング開始のカスタムフック
 * キャストが「合流」ボタンを押してギャラ飲みを開始する
 */
export function useStartSoloMatching() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startSoloMatching,
    onSuccess: () => {
      // マッチング一覧のキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['castSoloMatchings'] })
    },
  })
}
