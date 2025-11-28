import { createBrowserClient } from '@supabase/ssr'
import {
	NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from '@/libs/constants/env'

/**
 * ブラウザ用Supabaseクライアント
 * クライアントサイドでのSupabase接続に使用
 */
export function createClient() {
	return createBrowserClient(
		NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY,
	)
}
