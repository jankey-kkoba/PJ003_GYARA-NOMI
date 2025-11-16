import type { NextAuthConfig } from 'next-auth'

/**
 * Auth.jsの設定
 * LINEログイン認証を使用
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // LINE認証プロバイダーの設定は後で追加
    // {
    //   id: 'line',
    //   name: 'LINE',
    //   type: 'oauth',
    //   clientId: process.env.LINE_CLIENT_ID,
    //   clientSecret: process.env.LINE_CLIENT_SECRET,
    //   authorization: {
    //     url: 'https://access.line.me/oauth2/v2.1/authorize',
    //     params: { scope: 'profile openid email' },
    //   },
    //   token: 'https://api.line.me/oauth2/v2.1/token',
    //   userinfo: 'https://api.line.me/v2/profile',
    //   profile(profile) {
    //     return {
    //       id: profile.userId,
    //       name: profile.displayName,
    //       email: profile.email,
    //       image: profile.pictureUrl,
    //     }
    //   },
    // },
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // 未認証の場合はログインページへリダイレクト
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
  },
}
