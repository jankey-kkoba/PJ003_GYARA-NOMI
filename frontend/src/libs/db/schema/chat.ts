import { pgTable, text, boolean, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core'
import { users } from '@/libs/db/schema/users'

/**
 * チャットルームタイプのenum
 */
export const roomTypeEnum = pgEnum('room_type', ['dm', 'group'])

/**
 * メッセージタイプのenum
 */
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'system'])

/**
 * チャットルームテーブル
 * チャットルームの情報を管理
 */
export const chatRooms = pgTable('chat_rooms', {
  id: text('id').primaryKey(),
  roomType: roomTypeEnum('room_type').notNull(),
  dmKey: text('dm_key'), // DMの場合、2人のユーザーIDを結合した一意キー
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * チャットルームメンバーテーブル
 * チャットルームに参加しているユーザーを管理
 */
export const chatRoomMembers = pgTable(
  'chat_room_members',
  {
    roomId: text('room_id')
      .notNull()
      .references(() => chatRooms.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    muted: boolean('muted').notNull().default(false),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roomId, table.userId] }),
  })
)

/**
 * チャットメッセージテーブル
 * チャットメッセージの基本情報を管理
 */
export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id')
    .notNull()
    .references(() => chatRooms.id),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id),
  msgType: messageTypeEnum('msg_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deleted: boolean('deleted').notNull().default(false),
})

/**
 * チャットメッセージテキストテーブル
 * テキストメッセージの内容を管理
 */
export const chatMessageTexts = pgTable('chat_message_texts', {
  messageId: text('message_id')
    .primaryKey()
    .references(() => chatMessages.id),
  textContent: text('text_content').notNull(),
})

/**
 * チャットメッセージ既読ステータステーブル
 * メッセージの既読状態を管理
 */
export const chatMessageReadStatuses = pgTable(
  'chat_message_read_statuses',
  {
    messageId: text('message_id')
      .notNull()
      .references(() => chatMessages.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.userId] }),
  })
)
