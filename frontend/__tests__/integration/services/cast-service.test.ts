/**
 * castService Integration テスト
 *
 * ローカルSupabaseを使用してキャストサービスのDB操作を検証
 * 実際のクエリと年齢計算ロジックをテスト
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/libs/db'
import { users, userProfiles } from '@/libs/db/schema/users'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { areas } from '@/libs/db/schema/areas'
import { castService } from '@/features/cast/services/castService'

// テスト用のIDプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-cast-service-'

// テストデータの作成ヘルパー
async function createTestUser(id: string, email?: string) {
  const [user] = await db
    .insert(users)
    .values({
      id: `${TEST_PREFIX}${id}`,
      email: email || `${id}@test.example.com`,
      emailVerified: null,
      role: 'cast',
    })
    .returning()
  return user
}

async function createTestUserProfile(userId: string, name: string, birthDate: string) {
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

async function createTestArea(id: string, name: string) {
  const [area] = await db
    .insert(areas)
    .values({
      id: `${TEST_PREFIX}${id}`,
      name,
    })
    .returning()
  return area
}

async function createTestCastProfile(
  userId: string,
  options: {
    bio?: string
    rank?: number
    areaId?: string | null
    isActive?: boolean
  } = {}
) {
  const [castProfile] = await db
    .insert(castProfiles)
    .values({
      id: userId,
      bio: options.bio !== undefined ? options.bio : 'テスト用自己紹介',
      rank: options.rank !== undefined ? options.rank : 1,
      areaId: options.areaId === undefined ? null : options.areaId,
      isActive: options.isActive !== undefined ? options.isActive : true,
    })
    .returning()
  return castProfile
}

// テストデータのクリーンアップ
async function cleanupTestData() {
  // テストプレフィックスを持つデータを削除
  // 外部キー制約のため、castProfiles → userProfiles → users の順で削除

  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, users.id))

  const testUserIds = testUsers.filter((u) => u.id.startsWith(TEST_PREFIX)).map((u) => u.id)

  for (const userId of testUserIds) {
    await db.delete(castProfiles).where(eq(castProfiles.id, userId))
    await db.delete(userProfiles).where(eq(userProfiles.id, userId))
    await db.delete(users).where(eq(users.id, userId))
  }

  // エリアの削除
  const testAreas = await db.select({ id: areas.id }).from(areas)
  const testAreaIds = testAreas.filter((a) => a.id.startsWith(TEST_PREFIX)).map((a) => a.id)

  for (const areaId of testAreaIds) {
    await db.delete(areas).where(eq(areas.id, areaId))
  }
}

describe('castService Integration', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('getCastList', () => {
    describe('基本的な取得', () => {
      it('アクティブなキャスト一覧を取得できる', async () => {
        const user = await createTestUser('cast-1')
        await createTestUserProfile(user.id, 'キャスト1', '1990-01-01')
        await createTestCastProfile(user.id)

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts).toHaveLength(1)
        expect(result.casts[0].id).toBe(user.id)
        expect(result.casts[0].name).toBe('キャスト1')
        expect(result.total).toBe(1)
      })

      it('非アクティブなキャストは取得しない', async () => {
        const user1 = await createTestUser('cast-active')
        await createTestUserProfile(user1.id, 'アクティブ', '1990-01-01')
        await createTestCastProfile(user1.id, { isActive: true })

        const user2 = await createTestUser('cast-inactive')
        await createTestUserProfile(user2.id, '非アクティブ', '1990-01-01')
        await createTestCastProfile(user2.id, { isActive: false })

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts).toHaveLength(1)
        expect(result.casts[0].name).toBe('アクティブ')
        expect(result.total).toBe(1)
      })

      it('エリア情報を含めて取得できる', async () => {
        const area = await createTestArea('area-1', '渋谷')
        const user = await createTestUser('cast-with-area')
        await createTestUserProfile(user.id, 'キャスト', '1990-01-01')
        await createTestCastProfile(user.id, { areaId: area.id })

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts[0].areaName).toBe('渋谷')
      })

      it('エリアがnullの場合もnullで取得できる', async () => {
        const user = await createTestUser('cast-no-area')
        await createTestUserProfile(user.id, 'キャスト', '1990-01-01')
        await createTestCastProfile(user.id, { areaId: null })

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts[0].areaName).toBeNull()
      })
    })

    describe('年齢フィールド', () => {
      it('age フィールドが含まれている', async () => {
        const user = await createTestUser('cast-with-age')
        await createTestUserProfile(user.id, 'キャスト', '1990-01-01')
        await createTestCastProfile(user.id)

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts[0]).toHaveProperty('age')
        expect(typeof result.casts[0].age).toBe('number')
        expect(result.casts[0].age).toBeGreaterThan(0)
      })
    })

    describe('ページネーション', () => {
      beforeEach(async () => {
        // 20件のキャストを作成
        for (let i = 1; i <= 20; i++) {
          const user = await createTestUser(`cast-page-${i}`)
          await createTestUserProfile(user.id, `キャスト${i}`, '1990-01-01')
          await createTestCastProfile(user.id, { rank: i })
        }
      })

      it('1ページ目を正しく取得できる', async () => {
        const result = await castService.getCastList({ page: 1, limit: 10 })

        expect(result.casts).toHaveLength(10)
        expect(result.total).toBe(20)
      })

      it('2ページ目を正しく取得できる', async () => {
        const result = await castService.getCastList({ page: 2, limit: 10 })

        expect(result.casts).toHaveLength(10)
        expect(result.total).toBe(20)
      })

      it('最後のページを正しく取得できる', async () => {
        const result = await castService.getCastList({ page: 2, limit: 15 })

        expect(result.casts).toHaveLength(5) // 20 - 15 = 5
        expect(result.total).toBe(20)
      })

      it('範囲外のページは空配列を返す', async () => {
        const result = await castService.getCastList({ page: 10, limit: 10 })

        expect(result.casts).toHaveLength(0)
        expect(result.total).toBe(20)
      })

      it('limit=1で正しく動作する', async () => {
        const result = await castService.getCastList({ page: 1, limit: 1 })

        expect(result.casts).toHaveLength(1)
        expect(result.total).toBe(20)
      })
    })

    describe('データ構造', () => {
      it('正しいフィールドを含むキャストオブジェクトを返す', async () => {
        const area = await createTestArea('area-data', '新宿')
        const user = await createTestUser('cast-data')
        await createTestUserProfile(user.id, 'テストキャスト', '1990-01-01')
        await createTestCastProfile(user.id, {
          bio: 'よろしくお願いします',
          rank: 5,
          areaId: area.id,
        })

        const result = await castService.getCastList({ page: 1, limit: 12 })

        const cast = result.casts[0]
        expect(cast).toHaveProperty('id')
        expect(cast).toHaveProperty('name')
        expect(cast).toHaveProperty('age')
        expect(cast).toHaveProperty('bio')
        expect(cast).toHaveProperty('rank')
        expect(cast).toHaveProperty('areaName')

        expect(cast.id).toBe(user.id)
        expect(cast.name).toBe('テストキャスト')
        expect(cast.age).toBeGreaterThan(0)
        expect(cast.bio).toBe('よろしくお願いします')
        expect(cast.rank).toBe(5)
        expect(cast.areaName).toBe('新宿')
      })
    })

    describe('エッジケース', () => {
      it('キャストが0件の場合', async () => {
        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts).toHaveLength(0)
        expect(result.total).toBe(0)
      })

      it('日本語の名前を正しく扱える', async () => {
        const user = await createTestUser('cast-japanese')
        await createTestUserProfile(user.id, '山田花子', '1990-01-01')
        await createTestCastProfile(user.id)

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts[0].name).toBe('山田花子')
      })

      it('bioがnullの場合も取得できる', async () => {
        const user = await createTestUser('cast-no-bio')
        await createTestUserProfile(user.id, 'キャスト', '1990-01-01')
        await createTestCastProfile(user.id, { bio: '' })

        const result = await castService.getCastList({ page: 1, limit: 12 })

        expect(result.casts[0].bio).toBe('')
      })
    })
  })
})
