import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'
import { areas } from '@/libs/db/schema/areas'

/**
 * キャストプロフィールテーブル
 * キャスト固有のプロフィール情報を管理
 */
export const castProfiles = pgTable('cast_profiles', {
	id: text('id')
		.primaryKey()
		.references(() => users.id),
	bio: text('bio'), // 自己紹介
	rank: integer('rank').notNull().default(1), // キャストのランク
	areaId: text('area_id').references(() => areas.id), // 活動エリア
	isActive: boolean('is_active').notNull().default(true), // アクティブ状態（一覧に表示されるか）
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow(),
})
