import { useMutation, useQueryClient } from '@tanstack/react-query'
import { photosClient } from '@/libs/hono/client'

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

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage =
          'error' in errorData && typeof errorData.error === 'string'
            ? errorData.error
            : '写真のアップロードに失敗しました'
        throw new Error(errorMessage)
      }

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
