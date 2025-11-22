import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { auth } from '@/libs/auth'
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from '@/libs/constants/env'

/**
 * サーバー用Supabaseクライアント
 * Auth.jsのセッションからSupabaseのJWTトークンを取得し、
 * RLSポリシーの評価に使用
 */
export async function createClient() {
  const cookieStore = await cookies()
  const session = await auth()

  // デバッグ: セッション情報を確認
  console.log('[Supabase Client] Session:', {
    hasSession: !!session,
    userId: session?.user?.id,
    role: session?.user?.role,
    hasSupabaseToken: !!session?.supabaseAccessToken,
    tokenPreview: session?.supabaseAccessToken?.substring(0, 50),
  })

  const client = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentからset cookieは呼べない場合がある
          }
        },
      },
      global: {
        headers:
          session?.supabaseAccessToken
            ? {
                Authorization: `Bearer ${session.supabaseAccessToken}`,
              }
            : {},
      },
    }
  )

  return client
}

/**
 * Admin用Supabaseクライアント
 * RLSをバイパスして管理者権限でSupabaseにアクセス
 *
 * 注意: このクライアントはRLSポリシーをバイパスするため、
 * 使用前に必ずアプリケーション層で適切な権限チェックを行うこと
 */
export function createAdminClient() {
  return createSupabaseClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
