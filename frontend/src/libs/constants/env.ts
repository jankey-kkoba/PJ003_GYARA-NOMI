/**
 * 環境変数の定数定義
 * 環境変数を直接参照せず、このファイルを経由して利用する
 */

/**
 * Supabase 関連の環境変数
 */
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * データベース 関連の環境変数
 */
export const DATABASE_URL = process.env.DATABASE_URL!
