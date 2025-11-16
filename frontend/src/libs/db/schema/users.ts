import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

/**
 * ユーザーロールのenum
 * guest: ゲスト（料金を払い、キャストと飲み会をする男性ユーザー）
 * cast: キャスト（料金をもらい、ゲストと飲み会をする女性ユーザー）
 * admin: 管理者（通報等への対応やマスタの管理等を行う）
 */
export const userRoleEnum = pgEnum('user_role', ['guest', 'cast', 'admin'])

/**
 * ユーザーテーブル
 * キャスト、ゲスト共通のユーザー情報を管理
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
