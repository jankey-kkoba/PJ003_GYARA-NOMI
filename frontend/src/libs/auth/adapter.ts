import { eq, and } from 'drizzle-orm'
import type { Adapter, AdapterAccount, AdapterUser } from 'next-auth/adapters'
import { db } from '@/libs/db'
import { users } from '@/libs/db/schema/users'
import { accounts } from '@/libs/db/schema/auth'

/**
 * DBユーザーをAdapterUser形式に変換
 */
function toAdapterUser(user: {
	id: string
	email: string | null
	emailVerified: Date | null
	role: 'guest' | 'cast' | 'admin' | null
}): AdapterUser {
	return {
		id: user.id,
		email: user.email ?? '',
		emailVerified: user.emailVerified,
		role: user.role,
	}
}

/**
 * カスタムAuth.jsアダプター
 * JWT戦略用に最適化されたシンプルな実装
 * DrizzleAdapterをベースに、name/imageカラムを不要にしたバージョン
 */
export function CustomAdapter(): Adapter {
	return {
		/**
		 * ユーザーを作成
		 */
		async createUser(data) {
			const [user] = await db
				.insert(users)
				.values({
					email: data.email,
					emailVerified: data.emailVerified,
				})
				.returning()

			return toAdapterUser(user)
		},

		/**
		 * IDでユーザーを取得
		 */
		async getUser(id) {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, id))
				.limit(1)

			if (!user) return null

			return toAdapterUser(user)
		},

		/**
		 * メールアドレスでユーザーを取得
		 */
		async getUserByEmail(email) {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.email, email))
				.limit(1)

			if (!user) return null

			return toAdapterUser(user)
		},

		/**
		 * プロバイダーアカウントでユーザーを取得
		 */
		async getUserByAccount({ provider, providerAccountId }) {
			const [account] = await db
				.select()
				.from(accounts)
				.where(
					and(
						eq(accounts.provider, provider),
						eq(accounts.providerAccountId, providerAccountId),
					),
				)
				.limit(1)

			if (!account) return null

			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, account.userId))
				.limit(1)

			if (!user) return null

			return toAdapterUser(user)
		},

		/**
		 * ユーザーを更新
		 */
		async updateUser(data) {
			const [user] = await db
				.update(users)
				.set({
					email: data.email,
					emailVerified: data.emailVerified,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(users.id, data.id))
				.returning()

			return toAdapterUser(user)
		},

		/**
		 * ユーザーを削除
		 */
		async deleteUser(id) {
			await db.delete(users).where(eq(users.id, id))
		},

		/**
		 * アカウントをリンク
		 */
		async linkAccount(data) {
			await db.insert(accounts).values({
				userId: data.userId,
				type: data.type,
				provider: data.provider,
				providerAccountId: data.providerAccountId,
				refresh_token: data.refresh_token,
				access_token: data.access_token,
				expires_at: data.expires_at,
				token_type: data.token_type,
				scope: data.scope,
				id_token: data.id_token,
				session_state:
					typeof data.session_state === 'string' ? data.session_state : null,
			})

			return data as AdapterAccount
		},

		/**
		 * アカウントのリンクを解除
		 */
		async unlinkAccount({ provider, providerAccountId }) {
			await db
				.delete(accounts)
				.where(
					and(
						eq(accounts.provider, provider),
						eq(accounts.providerAccountId, providerAccountId),
					),
				)
		},
	}
}
