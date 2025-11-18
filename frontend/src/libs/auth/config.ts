import type { NextAuthConfig } from 'next-auth'
import Line from 'next-auth/providers/line'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/libs/db'
import { users } from '@/libs/db/schema/users'
import {
  accounts,
  sessions,
  verificationTokens,
} from '@/libs/db/schema/auth'

/**
 * Auth.jsの設定
 * LINEログイン認証を使用
 * Drizzleアダプターでデータベースと連携
 */
export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
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
