/**
 * soloMatchingService Integration テスト
 *
 * ローカルSupabaseを使用してソロマッチングサービスのDB操作を検証
 *
 * 前提条件:
 * - supabase db reset を実行してseed.sqlが適用されていること
 * - seed.sqlで定義されたユーザーデータが存在すること
 *   - seed-user-guest-001: ゲストユーザー
 *   - seed-user-cast-001: キャストユーザー
 *
 * 注意:
 * - テストでソロマッチングを作成する
 * - クリーンアップを実施してテストデータを削除
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { db } from '@/libs/db'
import { soloMatchings } from '@/libs/db/schema/solo-matchings'
import { soloMatchingService } from '@/features/solo-matching/services/soloMatchingService'

// 新規作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-solo-matching-service-'

// 新規作成したデータのクリーンアップ
async function cleanupTestData() {
  // LIKE演算子でテストプレフィックスに一致するソロマッチングを検索して削除
  const testMatchings = await db
    .select({ id: soloMatchings.id })
    .from(soloMatchings)
    .where(like(soloMatchings.id, `${TEST_PREFIX}%`))

  for (const { id } of testMatchings) {
    await db.delete(soloMatchings).where(eq(soloMatchings.id, id))
  }
}

describe('soloMatchingService Integration', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('createSoloMatching', () => {
    it('ソロマッチングを作成できる', async () => {
      const proposedDate = new Date(Date.now() + 86400000) // 明日

      const result = await soloMatchingService.createSoloMatching({
        guestId: 'seed-user-guest-001',
        castId: 'seed-user-cast-001',
        proposedDate,
        proposedDuration: 120, // 2時間
        proposedLocation: '渋谷',
        hourlyRate: 3000,
      })

      // 戻り値の検証
      expect(result).toBeDefined()
      expect(result.guestId).toBe('seed-user-guest-001')
      expect(result.castId).toBe('seed-user-cast-001')
      expect(result.proposedDuration).toBe(120)
      expect(result.proposedLocation).toBe('渋谷')
      expect(result.hourlyRate).toBe(3000)
      expect(result.totalPoints).toBe(6000) // 2時間 × 3000円/時
      expect(result.status).toBe('pending')
      expect(result.chatRoomId).toBeNull()

      // DBに実際に作成されているか検証
      const dbRecord = await db
        .select()
        .from(soloMatchings)
        .where(eq(soloMatchings.id, result.id))
        .limit(1)

      expect(dbRecord).toHaveLength(1)
      expect(dbRecord[0].guestId).toBe('seed-user-guest-001')
      expect(dbRecord[0].castId).toBe('seed-user-cast-001')
      expect(dbRecord[0].totalPoints).toBe(6000)

      // クリーンアップのためIDにプレフィックスを追加
      await db
        .update(soloMatchings)
        .set({ id: `${TEST_PREFIX}${result.id}` })
        .where(eq(soloMatchings.id, result.id))
    })

    it('合計ポイントが正しく計算される（30分の場合）', async () => {
      const proposedDate = new Date(Date.now() + 86400000)

      const result = await soloMatchingService.createSoloMatching({
        guestId: 'seed-user-guest-001',
        castId: 'seed-user-cast-001',
        proposedDate,
        proposedDuration: 30, // 30分
        proposedLocation: '新宿',
        hourlyRate: 4000,
      })

      // 30分 = 0.5時間 → 0.5 × 4000 = 2000ポイント
      expect(result.totalPoints).toBe(2000)

      // クリーンアップのためIDにプレフィックスを追加
      await db
        .update(soloMatchings)
        .set({ id: `${TEST_PREFIX}${result.id}` })
        .where(eq(soloMatchings.id, result.id))
    })

    it('合計ポイントが正しく計算される（3時間30分の場合）', async () => {
      const proposedDate = new Date(Date.now() + 86400000)

      const result = await soloMatchingService.createSoloMatching({
        guestId: 'seed-user-guest-001',
        castId: 'seed-user-cast-001',
        proposedDate,
        proposedDuration: 210, // 3時間30分
        proposedLocation: '池袋',
        hourlyRate: 5000,
      })

      // 3.5時間 × 5000 = 17500ポイント
      expect(result.totalPoints).toBe(17500)

      // クリーンアップのためIDにプレフィックスを追加
      await db
        .update(soloMatchings)
        .set({ id: `${TEST_PREFIX}${result.id}` })
        .where(eq(soloMatchings.id, result.id))
    })
  })
})
