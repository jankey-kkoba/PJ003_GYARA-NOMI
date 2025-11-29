/**
 * データベーススキーマのエクスポート
 * すべてのテーブル定義をここから参照する
 */

// Auth.js関連
export * from '@/libs/db/schema/auth'

// ユーザー関連
export * from '@/libs/db/schema/users'
export * from '@/libs/db/schema/cast-profiles'
export * from '@/libs/db/schema/cast-profile-photos'
export * from '@/libs/db/schema/favorites'

// エリア
export * from '@/libs/db/schema/areas'

// マッチング関連
export * from '@/libs/db/schema/matchings'
export * from '@/libs/db/schema/matching-participants'
export * from '@/libs/db/schema/cast-reviews'

// チャット関連
export * from '@/libs/db/schema/chat'
