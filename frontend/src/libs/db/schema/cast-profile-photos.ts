import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { castProfiles } from '@/libs/db/schema/cast-profiles'

/**
 * キャストプロフィール写真テーブル
 * キャストのプロフィール写真を複数枚管理
 */
export const castProfilePhotos = pgTable('cast_profile_photos', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	castProfileId: text('cast_profile_id')
		.notNull()
		.references(() => castProfiles.id, { onDelete: 'cascade' }),
	photoUrl: text('photo_url').notNull(), // Supabase Storageのパス
	displayOrder: integer('display_order').notNull().default(0), // 表示順序
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})
