/**
 * userService Integration テスト
 *
 * ローカルSupabaseを使用してユーザーサービスのDB操作を検証
 * 実際のトランザクションとクエリの動作をテスト
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/libs/db'
import { users, userProfiles } from '@/libs/db/schema/users'
import { accounts } from '@/libs/db/schema/auth'
import { userService } from '@/features/user/services/userService'

// テスト用のユーザーIDプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-user-service-'

// テストデータの作成ヘルパー
async function createTestUser(id: string, email?: string) {
  const [user] = await db
    .insert(users)
    .values({
      id: `${TEST_PREFIX}${id}`,
      email: email || `${id}@test.example.com`,
      emailVerified: null,
    })
    .returning()
  return user
}

async function createTestAccount(userId: string, provider: string, providerAccountId: string) {
  await db.insert(accounts).values({
    userId,
    type: 'oauth',
    provider,
    providerAccountId,
  })
}

async function createTestProfile(userId: string, name: string, birthDate: string) {
  const [profile] = await db
    .insert(userProfiles)
    .values({
      id: userId,
      name,
      birthDate,
    })
    .returning()
  return profile
}

// テストデータのクリーンアップ
async function cleanupTestData() {
  // テストプレフィックスを持つデータを削除
  // 外部キー制約のため、accounts → userProfiles → users の順で削除

  // accountsの削除
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, users.id))

  const testUserIds = testUsers
    .filter(u => u.id.startsWith(TEST_PREFIX))
    .map(u => u.id)

  for (const userId of testUserIds) {
    await db.delete(accounts).where(eq(accounts.userId, userId))
    await db.delete(userProfiles).where(eq(userProfiles.id, userId))
    await db.delete(users).where(eq(users.id, userId))
  }
}

describe('userService Integration', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('findAccountByProvider', () => {
    it('存在するアカウントを取得できる', async () => {
      const user = await createTestUser('find-account-1')
      await createTestAccount(user.id, 'line', 'line-123')

      const result = await userService.findAccountByProvider('line', 'line-123')

      expect(result).not.toBeNull()
      expect(result?.userId).toBe(user.id)
      expect(result?.provider).toBe('line')
      expect(result?.providerAccountId).toBe('line-123')
    })

    it('存在しないアカウントはnullを返す', async () => {
      const result = await userService.findAccountByProvider('line', 'non-existent')

      expect(result).toBeNull()
    })

    it('異なるプロバイダーのアカウントは取得しない', async () => {
      const user = await createTestUser('find-account-2')
      await createTestAccount(user.id, 'google', 'google-123')

      const result = await userService.findAccountByProvider('line', 'google-123')

      expect(result).toBeNull()
    })
  })

  describe('findUserById', () => {
    it('存在するユーザーを取得できる', async () => {
      const user = await createTestUser('find-user-1', 'finduser@test.com')

      const result = await userService.findUserById(user.id)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(user.id)
      expect(result?.email).toBe('finduser@test.com')
    })

    it('存在しないユーザーはnullを返す', async () => {
      const result = await userService.findUserById(`${TEST_PREFIX}non-existent`)

      expect(result).toBeNull()
    })
  })

  describe('accountExists', () => {
    it('アカウントが存在する場合はtrueを返す', async () => {
      const user = await createTestUser('account-exists-1')
      await createTestAccount(user.id, 'line', 'line-exists-123')

      const result = await userService.accountExists('line', 'line-exists-123')

      expect(result).toBe(true)
    })

    it('アカウントが存在しない場合はfalseを返す', async () => {
      const result = await userService.accountExists('line', 'line-not-exists')

      expect(result).toBe(false)
    })
  })

  describe('hasProfile', () => {
    it('プロフィールが存在する場合はtrueを返す', async () => {
      const user = await createTestUser('has-profile-1')
      await createTestProfile(user.id, 'テストユーザー', '1990-01-01')

      const result = await userService.hasProfile(user.id)

      expect(result).toBe(true)
    })

    it('プロフィールが存在しない場合はfalseを返す', async () => {
      const user = await createTestUser('has-profile-2')

      const result = await userService.hasProfile(user.id)

      expect(result).toBe(false)
    })
  })

  describe('registerProfile', () => {
    it('プロフィールを作成してロールを更新する', async () => {
      const user = await createTestUser('register-profile-1')

      const result = await userService.registerProfile(user.id, {
        name: '新規ユーザー',
        birthDate: '1995-05-15',
        userType: 'guest',
      })

      // プロフィールが作成されたか確認
      expect(result).not.toBeNull()
      expect(result.id).toBe(user.id)
      expect(result.name).toBe('新規ユーザー')
      expect(result.birthDate).toBe('1995-05-15')

      // ユーザーのロールが更新されたか確認
      const updatedUser = await userService.findUserById(user.id)
      expect(updatedUser?.role).toBe('guest')
    })

    it('キャストタイプでプロフィールを作成できる', async () => {
      const user = await createTestUser('register-profile-2')

      const result = await userService.registerProfile(user.id, {
        name: 'キャストユーザー',
        birthDate: '1998-12-25',
        userType: 'cast',
      })

      expect(result.name).toBe('キャストユーザー')

      const updatedUser = await userService.findUserById(user.id)
      expect(updatedUser?.role).toBe('cast')
    })

    it('日本語の名前を正しく保存できる', async () => {
      const user = await createTestUser('register-profile-3')

      const result = await userService.registerProfile(user.id, {
        name: '山田花子',
        birthDate: '2000-03-20',
        userType: 'cast',
      })

      expect(result.name).toBe('山田花子')
    })

    it('hasProfileがtrueを返すようになる', async () => {
      const user = await createTestUser('register-profile-4')

      // 登録前はfalse
      expect(await userService.hasProfile(user.id)).toBe(false)

      await userService.registerProfile(user.id, {
        name: 'テストユーザー',
        birthDate: '1990-01-01',
        userType: 'guest',
      })

      // 登録後はtrue
      expect(await userService.hasProfile(user.id)).toBe(true)
    })

    it('重複登録はエラーになる（主キー制約）', async () => {
      const user = await createTestUser('register-profile-5')

      // 1回目の登録
      await userService.registerProfile(user.id, {
        name: '1回目',
        birthDate: '1990-01-01',
        userType: 'guest',
      })

      // 2回目の登録はエラー
      await expect(
        userService.registerProfile(user.id, {
          name: '2回目',
          birthDate: '1990-01-01',
          userType: 'guest',
        })
      ).rejects.toThrow()
    })

    it('存在しないユーザーIDでエラーになる（外部キー制約）', async () => {
      await expect(
        userService.registerProfile(`${TEST_PREFIX}non-existent-user`, {
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        })
      ).rejects.toThrow()
    })
  })
})
