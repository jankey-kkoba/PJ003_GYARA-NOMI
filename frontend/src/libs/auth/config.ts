import type { NextAuthConfig } from 'next-auth'
import { SignJWT } from 'jose'
import Line from 'next-auth/providers/line'
import { CustomAdapter } from '@/libs/auth/adapter'
import { userService } from '@/features/user/services/userService'
import {
  LINE_CLIENT_ID,
  LINE_CLIENT_SECRET,
  SUPABASE_JWT_SECRET,
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
     * トークンにユーザーIDとロールを含め、SupabaseのJWTトークンも生成
     */
    async jwt({ token, user, trigger }) {
      // 初回ログイン時: userオブジェクトからIDとロールを設定
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      // トークン更新時: DBから最新のロール情報を取得
      // ユーザーがプロフィール登録などでロールが変更された可能性がある
      if (trigger === 'update' || !token.role) {
        const dbUser = await userService.findUserById(token.id)
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      // SupabaseのJWTトークンを生成
      // これにより、SupabaseのRLSポリシーでAuth.jsの認証を利用可能
      const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET)
      const supabaseAccessToken = await new SignJWT({
        sub: token.id,
        userId: token.id,
        role: 'authenticated',
        user_metadata: {
          id: token.id,
          role: token.role,
        },
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret)

      token.supabaseAccessToken = supabaseAccessToken

      return token
    },
    /**
     * セッションコールバック
     * セッションにユーザーIDとロール、SupabaseアクセストークンInclude
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.supabaseAccessToken = token.supabaseAccessToken
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
