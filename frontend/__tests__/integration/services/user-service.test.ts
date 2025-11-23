/**
 * userService Integration テスト
 *
 * ローカルSupabaseを使用してユーザーサービスのDB操作を検証
 * seed.sqlで用意されたテストデータを使用
 *
 * 前提条件:
 * - supabase db reset を実行してseed.sqlが適用されていること
 * - seed.sqlで定義されたユーザーデータが存在すること
 *
 * 注意:
 * - 一部のテストは新規ユーザーを作成する（registerProfile等）
 * - クリーンアップは行わないため、テストごとにsupabase db resetを推奨
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { db } from '@/libs/db'
import { users, userProfiles } from '@/libs/db/schema/users'
import { accounts } from '@/libs/db/schema/auth'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { userService } from '@/features/user/services/userService'

// 新規作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-user-service-'

// 新規作成したデータのクリーンアップ
async function cleanupTestData() {
  // LIKE演算子でテストプレフィックスに一致するユーザーを効率的に検索
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.id, `${TEST_PREFIX}%`))

  // 外部キー制約があるため、依存テーブルから先に削除
  for (const { id } of testUsers) {
    await db.delete(accounts).where(eq(accounts.userId, id))
    await db.delete(castProfiles).where(eq(castProfiles.id, id))
    await db.delete(userProfiles).where(eq(userProfiles.id, id))
    await db.delete(users).where(eq(users.id, id))
  }
}

describe('userService Integration', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('findAccountByProvider', () => {
    it('存在するアカウントを取得できる (seed data)', async () => {
      // seed.sqlで用意されたゲストユーザー
      const result = await userService.findAccountByProvider('line', 'seed-line-guest-001')

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('seed-user-guest-001')
      expect(result?.provider).toBe('line')
      expect(result?.providerAccountId).toBe('seed-line-guest-001')
    })

    it('存在するキャストのアカウントを取得できる (seed data)', async () => {
      // seed.sqlで用意されたキャストユーザー
      const result = await userService.findAccountByProvider('line', 'seed-line-cast-001')

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('seed-user-cast-001')
      expect(result?.provider).toBe('line')
      expect(result?.providerAccountId).toBe('seed-line-cast-001')
    })

    it('存在しないアカウントはnullを返す', async () => {
      const result = await userService.findAccountByProvider('line', 'non-existent')

      expect(result).toBeNull()
    })

    it('異なるプロバイダーのアカウントは取得しない', async () => {
      // seed.sqlで用意されたGoogleアカウント
      const result = await userService.findAccountByProvider('line', 'seed-google-account-001')

      expect(result).toBeNull()
    })

    it('Googleプロバイダーで正しく取得できる', async () => {
      // seed.sqlで用意されたGoogleアカウント
      const result = await userService.findAccountByProvider('google', 'seed-google-account-001')

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('seed-user-google-001')
      expect(result?.provider).toBe('google')
    })
  })

  describe('findUserById', () => {
    it('存在するゲストユーザーを取得できる (seed data)', async () => {
      const result = await userService.findUserById('seed-user-guest-001')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('seed-user-guest-001')
      expect(result?.email).toBe('seed-guest-001@test.example.com')
      expect(result?.role).toBe('guest')
    })

    it('存在するキャストユーザーを取得できる (seed data)', async () => {
      const result = await userService.findUserById('seed-user-cast-001')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('seed-user-cast-001')
      expect(result?.email).toBe('seed-cast-001@test.example.com')
      expect(result?.role).toBe('cast')
    })

    it('存在しないユーザーはnullを返す', async () => {
      const result = await userService.findUserById('non-existent-user-id')

      expect(result).toBeNull()
    })
  })

  describe('accountExists', () => {
    it('アカウントが存在する場合はtrueを返す (seed data)', async () => {
      const result = await userService.accountExists('line', 'seed-line-guest-001')

      expect(result).toBe(true)
    })

    it('キャストのアカウントが存在する場合はtrueを返す (seed data)', async () => {
      const result = await userService.accountExists('line', 'seed-line-cast-001')

      expect(result).toBe(true)
    })

    it('アカウントが存在しない場合はfalseを返す', async () => {
      const result = await userService.accountExists('line', 'line-not-exists')

      expect(result).toBe(false)
    })
  })

  describe('hasProfile', () => {
    it('プロフィールが存在する場合はtrueを返す (seed data)', async () => {
      // seed.sqlで用意されたプロフィール登録済みゲスト
      const result = await userService.hasProfile('seed-user-guest-001')

      expect(result).toBe(true)
    })

    it('キャストのプロフィールが存在する場合はtrueを返す (seed data)', async () => {
      const result = await userService.hasProfile('seed-user-cast-001')

      expect(result).toBe(true)
    })

    it('プロフィールが存在しない場合はfalseを返す (seed data)', async () => {
      // seed.sqlで用意されたプロフィール未登録ゲスト
      const result = await userService.hasProfile('seed-user-guest-no-profile')

      expect(result).toBe(false)
    })

    it('存在しないユーザーIDはfalseを返す', async () => {
      const result = await userService.hasProfile('non-existent-user-id')

      expect(result).toBe(false)
    })
  })

  describe('registerProfile', () => {
    it('プロフィールを作成してロールを更新する', async () => {
      // 新規ユーザーを作成（テスト用）
      const [user] = await db
        .insert(users)
        .values({
          id: `${TEST_PREFIX}register-001`,
          email: 'register-001@test.example.com',
          emailVerified: null,
        })
        .returning()

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
      const [user] = await db
        .insert(users)
        .values({
          id: `${TEST_PREFIX}register-002`,
          email: 'register-002@test.example.com',
          emailVerified: null,
        })
        .returning()

      const result = await userService.registerProfile(user.id, {
        name: 'キャストユーザー',
        birthDate: '1998-12-25',
        userType: 'cast',
      })

      expect(result.name).toBe('キャストユーザー')

      const updatedUser = await userService.findUserById(user.id)
      expect(updatedUser?.role).toBe('cast')

      // キャストの場合、cast_profileが自動生成されていることを確認
      const [castProfile] = await db
        .select()
        .from(castProfiles)
        .where(eq(castProfiles.id, user.id))
        .limit(1)

      expect(castProfile).not.toBeUndefined()
      expect(castProfile.id).toBe(user.id)
      expect(castProfile.rank).toBe(1) // デフォルト値
      expect(castProfile.isActive).toBe(true) // デフォルト値
    })

    it('ゲストタイプの場合、cast_profileは作成されない', async () => {
      const [user] = await db
        .insert(users)
        .values({
          id: `${TEST_PREFIX}register-003`,
          email: 'register-003@test.example.com',
          emailVerified: null,
        })
        .returning()

      await userService.registerProfile(user.id, {
        name: 'ゲストユーザー',
        birthDate: '1995-05-15',
        userType: 'guest',
      })

      // ゲストの場合、cast_profileは作成されない
      const [castProfile] = await db
        .select()
        .from(castProfiles)
        .where(eq(castProfiles.id, user.id))
        .limit(1)

      expect(castProfile).toBeUndefined()
    })

    it('日本語の名前を正しく保存できる', async () => {
      const [user] = await db
        .insert(users)
        .values({
          id: `${TEST_PREFIX}register-004`,
          email: 'register-004@test.example.com',
          emailVerified: null,
        })
        .returning()

      const result = await userService.registerProfile(user.id, {
        name: '山田花子',
        birthDate: '2000-03-20',
        userType: 'cast',
      })

      expect(result.name).toBe('山田花子')
    })

    it('hasProfileがtrueを返すようになる', async () => {
      const [user] = await db
        .insert(users)
        .values({
          id: `${TEST_PREFIX}register-005`,
          email: 'register-005@test.example.com',
          emailVerified: null,
        })
        .returning()

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
      const [user] = await db
        .insert(users)
        .values({
          id: `${TEST_PREFIX}register-006`,
          email: 'register-006@test.example.com',
          emailVerified: null,
        })
        .returning()

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
        userService.registerProfile('non-existent-user-id', {
          name: 'テストユーザー',
          birthDate: '1990-01-01',
          userType: 'guest',
        })
      ).rejects.toThrow()
    })
  })
})
