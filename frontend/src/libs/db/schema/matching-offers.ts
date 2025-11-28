import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { matchings } from '@/libs/db/schema/matchings'
import { users } from '@/libs/db/schema/users'

/**
 * マッチングオファーテーブル
 * マッチングに対するオファー（参加申し込み）を管理
 */
export const matchingOffers = pgTable('matching_offers', {
	id: text('id').primaryKey(),
	matchingId: text('matching_id')
		.notNull()
		.references(() => matchings.id),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	status: integer('status').notNull(), // オファーのステータス（0: 申請中, 1: 承認, 2: 拒否等）
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})
