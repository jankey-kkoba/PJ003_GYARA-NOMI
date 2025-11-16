import { pgTable, text } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'

/**
 * キャストテーブル
 * キャスト固有の情報を管理
 */
export const casts = pgTable('casts', {
  id: text('id')
    .primaryKey()
    .references(() => users.id),
  name: text('name').notNull(),
})
