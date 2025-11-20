import { pgTable, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'
import { chatRooms } from '@/libs/db/schema/chat'

/**
 * マッチングステータスのenum
 */
export const matchingStatusEnum = pgEnum('matching_status', [
  'pending', // 回答待ち
  'accepted', // 承認済み（成立）
  'rejected', // 拒否（キャストによる不成立）
  'cancelled', // キャンセル（成立後のキャンセル）
  'meeting', // 合流待ち（成立後、ギャラ飲み開始前）
  'in_progress', // ギャラ飲み中
  'completed', // 完了
])

/**
 * ソロマッチングテーブル
 * 1対1のギャラ飲みマッチング情報を管理
 */
export const soloMatchings = pgTable('solo_matchings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  guestId: text('guest_id')
    .notNull()
    .references(() => users.id),
  castId: text('cast_id')
    .notNull()
    .references(() => users.id),
  chatRoomId: text('chat_room_id').references(() => chatRooms.id),
  status: matchingStatusEnum('status').notNull().default('pending'),

  // オファー情報
  proposedDate: timestamp('proposed_date', { withTimezone: true }).notNull(), // 希望日時
  proposedDuration: integer('proposed_duration').notNull(), // 希望時間（分）
  proposedLocation: text('proposed_location').notNull(), // 希望場所（文字列）
  hourlyRate: integer('hourly_rate').notNull(), // 時給（オファー時点での金額・ポイント）
  totalPoints: integer('total_points').notNull(), // 合計ポイント

  // ギャラ飲み実施情報
  startedAt: timestamp('started_at', { withTimezone: true }), // 開始時刻（合流ボタン押下時）
  scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }), // 予定終了時刻
  actualEndAt: timestamp('actual_end_at', { withTimezone: true }), // 実際の終了時刻
  extensionMinutes: integer('extension_minutes').default(0), // 延長時間（分）
  extensionPoints: integer('extension_points').default(0), // 延長ポイント

  // メタ情報
  castRespondedAt: timestamp('cast_responded_at', { withTimezone: true }), // キャストが回答した日時
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
