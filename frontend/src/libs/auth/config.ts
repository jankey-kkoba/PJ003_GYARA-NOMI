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
}
