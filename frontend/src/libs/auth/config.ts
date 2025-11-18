import type { NextAuthConfig } from 'next-auth'
// import { LINE_CLIENT_ID, LINE_CLIENT_SECRET } from '@/libs/constants/env'
import Line from "next-auth/providers/line"

/**
 * Auth.jsの設定
 * LINEログイン認証を使用
 */
export const authConfig: NextAuthConfig = {
  providers: [Line],
  pages: {
    signIn: '/login',
  },
  callbacks: {
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
