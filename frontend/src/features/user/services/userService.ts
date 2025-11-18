import { eq, and } from 'drizzle-orm'
import { db } from '@/libs/db'
import { users } from '@/libs/db/schema/users'
import { accounts } from '@/libs/db/schema/auth'

/**
 * ユーザーサービス
 * ユーザー関連のデータベース操作を提供
 */
export const userService = {
  /**
   * プロバイダーアカウントIDでアカウントを検索
   * @param provider - プロバイダー名（例: 'line'）
   * @param providerAccountId - プロバイダーが発行したアカウントID
   * @returns アカウント情報、存在しない場合はnull
   */
  async findAccountByProvider(provider: string, providerAccountId: string) {
    const result = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      )
      .limit(1)

    return result[0] || null
  },

  /**
   * ユーザーIDでユーザーを検索
   * @param userId - ユーザーID
   * @returns ユーザー情報、存在しない場合はnull
   */
  async findUserById(userId: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return result[0] || null
  },

  /**
   * アカウントが存在するか確認
   * @param provider - プロバイダー名
   * @param providerAccountId - プロバイダーアカウントID
   * @returns 存在する場合はtrue
   */
  async accountExists(provider: string, providerAccountId: string) {
    const account = await this.findAccountByProvider(provider, providerAccountId)
    return account !== null
  },
}
