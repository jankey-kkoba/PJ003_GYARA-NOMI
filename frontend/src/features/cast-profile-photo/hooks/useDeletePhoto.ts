import { useMutation, useQueryClient } from '@tanstack/react-query'
import { photosClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'

/**
 * 写真削除用のmutationフック
 * @returns mutation オブジェクト
 */
export function useDeletePhoto() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (photoId: string) => {
			const res = await photosClient.api.casts.photos[':photoId'].$delete({
				param: { photoId },
			})

			await handleApiError(res, '写真の削除に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('写真の削除に失敗しました')
			}

			return result
		},
		onSuccess: () => {
			// 写真一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: ['casts', 'photos'],
			})
		},
	})
}
