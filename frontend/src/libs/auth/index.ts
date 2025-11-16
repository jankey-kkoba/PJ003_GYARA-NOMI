import NextAuth from 'next-auth'
import { authConfig } from '@/libs/auth/config'

/**
 * Auth.jsのエクスポート
 * 認証機能を提供
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
