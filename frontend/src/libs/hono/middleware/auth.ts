import { initAuthConfig, type AuthConfig } from '@hono/auth-js'
import Line from 'next-auth/providers/line'
import {
  AUTH_SECRET,
  LINE_CLIENT_ID,
  LINE_CLIENT_SECRET,
} from '@/libs/constants/env'

/**
 * Hono用のAuth.js設定
 * API Routesで使用するAuth.jsミドルウェア
 */
export const honoAuthMiddleware = initAuthConfig((): AuthConfig => ({
  secret: AUTH_SECRET,
  providers: [
    Line({
      clientId: LINE_CLIENT_ID,
      clientSecret: LINE_CLIENT_SECRET,
    }),
  ],
}))
