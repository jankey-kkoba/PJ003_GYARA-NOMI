import { pgTable, text, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'
import { matchings } from '@/libs/db/schema/matchings'

/**
 * 参加者ステータスのenum
 */
export const participantStatusEnum = pgEnum('participant_status', [
	'pending', // 回答待ち
	'accepted', // 承認
	'rejected', // 拒否
	'joined', // 合流済み
	'completed', // 完了
])

/**
 * マッチング参加者テーブル
 * マッチングに参加するキャストを管理
 */
export const matchingParticipants = pgTable(
	'matching_participants',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		matchingId: text('matching_id')
			.notNull()
			.references(() => matchings.id, { onDelete: 'cascade' }),
		castId: text('cast_id')
			.notNull()
			.references(() => users.id),
		status: participantStatusEnum('status').notNull().default('pending'),

		respondedAt: timestamp('responded_at', { withTimezone: true }), // キャストが回答した日時
		joinedAt: timestamp('joined_at', { withTimezone: true }), // キャストが合流した日時
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [unique().on(table.matchingId, table.castId)],
)
