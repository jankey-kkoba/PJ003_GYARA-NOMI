import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@/libs/auth'
import {
	NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from '@/libs/constants/env'

/**
 * サーバー用Supabaseクライアント
 * Auth.jsのセッションからSupabaseのJWTトークンを取得し、
 * RLSポリシーの評価に使用
 */
export async function createClient() {
	const cookieStore = await cookies()
	const session = await auth()

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
							cookieStore.set(name, value, options),
						)
					} catch {
						// Server Componentからset cookieは呼べない場合がある
					}
				},
			},
			global: {
				headers: session?.supabaseAccessToken
					? {
							Authorization: `Bearer ${session.supabaseAccessToken}`,
						}
					: {},
			},
		},
	)

	return client
}
