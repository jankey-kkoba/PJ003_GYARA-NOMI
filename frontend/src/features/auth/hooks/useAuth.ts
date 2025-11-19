'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

/**
 * 認証関連のカスタムフック
 */
export function useAuth() {
  const { data: session, status } = useSession()

  /**
   * LINEログイン処理
   * @param userType - 会員登録時のユーザータイプ（オプション）
   */
  const lineLogin = async (userType?: 'guest' | 'cast') => {
    try {
      // userTypeが指定されている場合はcallbackUrlに含める
      const callbackUrl = userType ? `/?userType=${userType}` : '/'
      await signIn('line', { callbackUrl })
    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    }
  }

  /**
   * ログアウト処理
   */
  const logout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
      throw error
    }
  }

  return {
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user ?? null,
    lineLogin,
    logout,
  }
}
