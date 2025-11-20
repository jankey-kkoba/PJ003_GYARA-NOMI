import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { soloMatchings } from '@/libs/db/schema/solo-matchings'
import { users } from '@/libs/db/schema/users'

/**
 * キャスト評価テーブル
 * ギャラ飲み終了後にゲストがキャストを評価した内容を管理
 */
export const castReviews = pgTable('cast_reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchingId: text('matching_id')
    .notNull()
    .references(() => soloMatchings.id),
  guestId: text('guest_id')
    .notNull()
    .references(() => users.id),
  castId: text('cast_id')
    .notNull()
    .references(() => users.id),
  rating: integer('rating').notNull(), // 評価（1-5）
  comment: text('comment'), // コメント（任意）
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
