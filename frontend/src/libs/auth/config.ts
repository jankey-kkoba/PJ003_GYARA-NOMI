import type { NextAuthConfig } from 'next-auth'
import Line from 'next-auth/providers/line'
import { CustomAdapter } from '@/libs/auth/adapter'
import {
  LINE_CLIENT_ID,
  LINE_CLIENT_SECRET,
} from '@/libs/constants/env'

/**
 * Auth.jsの設定
 * LINEログイン認証を使用
 * Drizzleアダプターでデータベースと連携
 */
export const authConfig: NextAuthConfig = {
  adapter: CustomAdapter(),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Line({
      clientId: LINE_CLIENT_ID,
      clientSecret: LINE_CLIENT_SECRET,
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    /**
     * JWTコールバック
     * セッションにユーザーIDを含める
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    /**
     * セッションコールバック
     * セッションにユーザーIDを含める
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    /**
     * リダイレクト時の処理
     */
    async redirect({ url, baseUrl }) {
      // 同一オリジンのURLはそのまま許可
      if (url.startsWith(baseUrl)) {
        return url
      }
      // 相対URLの場合はbaseUrlを付加
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      return baseUrl
    },
  },
}
