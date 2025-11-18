'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

/**
 * 認証関連のカスタムフック
 */
export function useAuth() {
  const { data: session, status } = useSession()

  /**
   * LINEログイン処理
   */
  const lineLogin = async () => {
    try {
      await signIn('line')
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
