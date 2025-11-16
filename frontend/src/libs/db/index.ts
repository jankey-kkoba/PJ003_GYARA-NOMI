import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { DATABASE_URL } from '@/libs/constants/env'

/**
 * データベース接続のシングルトンインスタンス
 * Drizzle ORMのラッパー
 */

// クエリ実行用のクライアント
const client = postgres(DATABASE_URL)

export const db = drizzle(client)
