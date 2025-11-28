import { eq, and } from 'drizzle-orm'
import { db } from '@/libs/db'
import { favorites } from '@/libs/db/schema/favorites'

/**
 * お気に入りサービス
 * お気に入り関連のデータベース操作を提供
 */
export const favoriteService = {
	/**
	 * お気に入りに追加
	 * @param guestId - ゲストのユーザーID
	 * @param castId - キャストのユーザーID
	 */
	async addFavorite(guestId: string, castId: string): Promise<void> {
		await db.insert(favorites).values({ guestId, castId }).onConflictDoNothing()
	},

	/**
	 * お気に入りから削除
	 * @param guestId - ゲストのユーザーID
	 * @param castId - キャストのユーザーID
	 */
	async removeFavorite(guestId: string, castId: string): Promise<void> {
		await db
			.delete(favorites)
			.where(and(eq(favorites.guestId, guestId), eq(favorites.castId, castId)))
	},

	/**
	 * お気に入り状態を確認
	 * @param guestId - ゲストのユーザーID
	 * @param castId - キャストのユーザーID
	 * @returns お気に入り登録済みかどうか
	 */
	async isFavorite(guestId: string, castId: string): Promise<boolean> {
		const [result] = await db
			.select()
			.from(favorites)
			.where(and(eq(favorites.guestId, guestId), eq(favorites.castId, castId)))
			.limit(1)

		return !!result
	},
}
