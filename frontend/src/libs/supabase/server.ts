import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from '@/libs/constants/env'

/**
 * サーバー用Supabaseクライアント
 * サーバーサイドでのSupabase接続に使用
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
    }
  )
}
