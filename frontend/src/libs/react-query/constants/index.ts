/**
 * React Query (Tanstack Query)の設定定数
 */

/**
 * クエリのデフォルトstaleTime (ミリ秒)
 * データが古いと見なされるまでの時間
 */
export const DEFAULT_STALE_TIME = 60 * 1000 // 1分

/**
 * クエリのデフォルトリトライ回数
 * 失敗時に再試行する回数
 */
export const DEFAULT_RETRY_COUNT = 1
