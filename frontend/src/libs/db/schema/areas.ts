import { pgTable, text } from 'drizzle-orm/pg-core'

/**
 * エリアテーブル
 * キャストやゲストの活動エリアを管理
 */
export const areas = pgTable('areas', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
})
