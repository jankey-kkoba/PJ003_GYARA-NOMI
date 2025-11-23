import { eq, and } from 'drizzle-orm'
import { db } from '@/libs/db'
import { users, userProfiles } from '@/libs/db/schema/users'
import { accounts } from '@/libs/db/schema/auth'
import { castProfiles } from '@/libs/db/schema/cast-profiles'

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
   * メールアドレスでユーザーを検索
   * @param email - メールアドレス
   * @returns ユーザー情報、存在しない場合はnull
   */
  async findUserByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
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

  /**
   * ユーザープロフィールが存在するか確認
   * @param userId - ユーザーID
   * @returns 存在する場合はtrue
   */
  async hasProfile(userId: string) {
    const result = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1)

    return result.length > 0
  },

  /**
   * プロフィール登録（トランザクション）
   * プロフィール作成とユーザーロール更新を同時に実行
   * キャストの場合はcast_profilesも自動生成
   * @param userId - ユーザーID
   * @param input - プロフィールデータとユーザータイプ
   * @returns 作成されたプロフィール情報
   */
  async registerProfile(
    userId: string,
    input: { name: string; birthDate: string; userType: 'guest' | 'cast' }
  ) {
    const result = await db.transaction(async (tx) => {
      // プロフィールを作成
      const [profile] = await tx
        .insert(userProfiles)
        .values({
          id: userId,
          name: input.name,
          birthDate: input.birthDate,
        })
        .returning()

      // ユーザーのロールを更新
      await tx
        .update(users)
        .set({ role: input.userType, updatedAt: new Date() })
        .where(eq(users.id, userId))

      // キャストの場合、cast_profilesも自動生成
      if (input.userType === 'cast') {
        await tx.insert(castProfiles).values({
          id: userId,
        })
      }

      return profile
    })

    return result
  },
}
