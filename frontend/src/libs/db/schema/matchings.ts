import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'

/**
 * マッチングテーブル
 * ギャラ飲みのマッチング情報を管理
 */
export const matchings = pgTable('matchings', {
  id: text('id').primaryKey(),
  hostId: text('host_id')
    .notNull()
    .references(() => users.id),
  status: integer('status').notNull(), // マッチングのステータス（0: 募集中, 1: 確定, 2: 完了, 3: キャンセル等）
  chatRoomId: text('chat_room_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
