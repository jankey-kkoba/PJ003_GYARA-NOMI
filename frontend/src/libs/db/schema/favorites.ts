import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'

/**
 * お気に入りテーブル
 * ゲストがキャストをお気に入り登録する情報を管理
 */
export const favorites = pgTable(
	'favorites',
	{
		guestId: text('guest_id')
			.notNull()
			.references(() => users.id),
		castId: text('cast_id')
			.notNull()
			.references(() => users.id),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.guestId, table.castId] })],
)
