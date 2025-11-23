/**
 * 環境変数の定数定義
 * 環境変数を直接参照せず、このファイルを経由して利用する
 */

/**
 * Supabase 関連の環境変数
 */
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!

/**
 * データベース 関連の環境変数
 */
export const DATABASE_URL = process.env.DATABASE_URL!

/**
 * Auth.js 関連の環境変数
 */
export const AUTH_SECRET = process.env.AUTH_SECRET!

/**
 * LINE OAuth 関連の環境変数
 */
export const LINE_CLIENT_ID = process.env.AUTH_LINE_ID!
export const LINE_CLIENT_SECRET = process.env.AUTH_LINE_SECRET!

export const APP_ENV = process.env.APP_ENV!