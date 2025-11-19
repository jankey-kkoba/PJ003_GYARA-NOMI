import { useMutation } from '@tanstack/react-query'
import { usersClient } from '@/libs/hono/client'

/**
 * プロフィール登録リクエストの入力データ
 */
type RegisterProfileInput = {
  name: string
  birthDate: string
  userType: 'guest' | 'cast'
}

/**
 * プロフィール登録用のmutationフック
 * @returns mutation オブジェクト
 */
export function useRegisterUser() {
  return useMutation({
    mutationFn: async (input: RegisterProfileInput) => {
      const res = await usersClient.api.users.register.$post({
        json: input,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          'error' in errorData ? errorData.error : '登録に失敗しました'
        )
      }

      return res.json()
    },
  })
}
