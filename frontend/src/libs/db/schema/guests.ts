import { pgTable, text } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'

/**
 * ゲストテーブル
 * ゲスト固有の情報を管理
 */
export const guests = pgTable('guests', {
  id: text('id')
    .primaryKey()
    .references(() => users.id),
  name: text('name').notNull(),
  rank: text('rank').notNull(),
})
