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
import { userService } from '@/features/user/services/userService'

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
     * サインイン時の処理
     * 未登録ユーザーは会員登録ページにリダイレクト
     */
    async signIn({ account }) {
      if (!account) return false

      // アカウントが既に存在するか確認
      const exists = await userService.accountExists(
        account.provider,
        account.providerAccountId
      )

      // アカウントが存在しない場合（新規ユーザー）は会員登録ページにリダイレクト
      if (!exists) {
        const params = new URLSearchParams({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        })
        return `/register?${params.toString()}`
      }

      return true
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
