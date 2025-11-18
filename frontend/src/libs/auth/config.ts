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
     * ログイン成功時にクエリパラメータを付けてリダイレクト
     */
    async redirect({ url, baseUrl }) {
      // ログイン後のリダイレクト時にlogin=successパラメータを追加
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/?login=success`
      }
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
