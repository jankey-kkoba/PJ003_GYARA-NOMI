import { hc } from 'hono/client'
import type { UsersAppType } from '@/app/api/users/route'

/**
 * Honoクライアントのベースオプション
 */
const clientOptions = {
  init: {
    credentials: 'include' as const,
  },
}

/**
 * ユーザーAPIクライアント
 * 型安全なRPCクライアント
 */
export const usersClient = hc<UsersAppType>('/', clientOptions)
