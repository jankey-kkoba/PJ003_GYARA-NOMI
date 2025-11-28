import { useMutation, useQueryClient } from '@tanstack/react-query'
import { photosClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'

/**
 * 写真アップロード用のmutationフック
 * @returns mutation オブジェクト
 */
export function useUploadPhoto() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (file: File) => {
			const res = await photosClient.api.casts.photos.$post({
				form: {
					file,
				},
			})

			await handleApiError(res, '写真のアップロードに失敗しました')

			const result = await res.json()

			if (!result.success || !result.data) {
				throw new Error('写真のアップロードに失敗しました')
			}

			return result.data.photo
		},
		onSuccess: () => {
			// 写真一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: ['casts', 'photos'],
			})
		},
	})
}
