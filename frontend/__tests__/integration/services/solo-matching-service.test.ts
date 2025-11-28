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

	describe('getGuestSoloMatchings', () => {
		it('ゲストのマッチング一覧を取得できる', async () => {
			// seed.sqlで用意されたテストデータを使用
			const results = await soloMatchingService.getGuestSoloMatchings(
				'seed-user-guest-001',
			)

			// seed.sqlで定義した4件のマッチングが取得されることを確認
			expect(results.length).toBeGreaterThanOrEqual(4)

			// 全てのマッチングがゲストIDと一致することを確認
			results.forEach((result) => {
				expect(result.guestId).toBe('seed-user-guest-001')
			})

			// ステータスが pending, accepted, rejected, cancelled, in_progress のみであることを確認
			results.forEach((result) => {
				expect([
					'pending',
					'accepted',
					'rejected',
					'cancelled',
					'in_progress',
				]).toContain(result.status)
			})

			// seed.sqlで定義した各ステータスのマッチングが含まれていることを確認
			const statuses = results.map((r) => r.status)
			expect(statuses).toContain('pending')
			expect(statuses).toContain('accepted')
			expect(statuses).toContain('rejected')
			expect(statuses).toContain('cancelled')
		})

		it('マッチングが0件の場合は空配列を返す', async () => {
			// 存在しないゲストIDで検索
			const results = await soloMatchingService.getGuestSoloMatchings(
				'non-existent-guest-id',
			)

			expect(results).toEqual([])
		})

		it('作成日時の降順でソートされる', async () => {
			// seed.sqlのデータで確認（seed-solo-matching-pending-001が最古、seed-solo-matching-cancelled-001が最新）
			const results = await soloMatchingService.getGuestSoloMatchings(
				'seed-user-guest-001',
			)

			// 作成日時の降順でソートされていることを確認
			for (let i = 0; i < results.length - 1; i++) {
				expect(results[i].createdAt.getTime()).toBeGreaterThanOrEqual(
					results[i + 1].createdAt.getTime(),
				)
			}
		})

		it('特定のゲストのマッチングのみを取得する', async () => {
			// seed-user-guest-001のマッチング一覧
			const results1 = await soloMatchingService.getGuestSoloMatchings(
				'seed-user-guest-001',
			)
			// seed-user-guest-002のマッチング一覧
			const results2 = await soloMatchingService.getGuestSoloMatchings(
				'seed-user-guest-002',
			)

			// それぞれのゲストIDと一致することを確認
			results1.forEach((result) => {
				expect(result.guestId).toBe('seed-user-guest-001')
			})
			results2.forEach((result) => {
				expect(result.guestId).toBe('seed-user-guest-002')
			})

			// seed-user-guest-001には4件、seed-user-guest-002には1件のマッチングがある
			expect(results1.length).toBe(4)
			expect(results2.length).toBe(1)
		})
	})

	describe('respondToSoloMatching', () => {
		it('キャストがマッチングを承認できる', async () => {
			// テスト用のマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// マッチングに承認で回答
			const result = await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// ステータスが承認に更新されていることを確認
			expect(result.status).toBe('accepted')
			expect(result.castRespondedAt).toBeDefined()
			expect(result.castRespondedAt).toBeInstanceOf(Date)

			// DBに実際に更新されているか検証
			const dbRecord = await db
				.select()
				.from(soloMatchings)
				.where(eq(soloMatchings.id, matching.id))
				.limit(1)

			expect(dbRecord).toHaveLength(1)
			expect(dbRecord[0].status).toBe('accepted')
			expect(dbRecord[0].castRespondedAt).toBeDefined()

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('キャストがマッチングを拒否できる', async () => {
			// テスト用のマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// マッチングに拒否で回答
			const result = await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'rejected',
			)

			// ステータスが拒否に更新されていることを確認
			expect(result.status).toBe('rejected')
			expect(result.castRespondedAt).toBeDefined()

			// DBに実際に更新されているか検証
			const dbRecord = await db
				.select()
				.from(soloMatchings)
				.where(eq(soloMatchings.id, matching.id))
				.limit(1)

			expect(dbRecord[0].status).toBe('rejected')

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('マッチングが見つからない場合はエラーを投げる', async () => {
			await expect(
				soloMatchingService.respondToSoloMatching(
					'non-existent-matching-id',
					'seed-user-cast-001',
					'accepted',
				),
			).rejects.toThrow('マッチングが見つかりません')
		})

		it('キャストIDが一致しない場合はエラーを投げる', async () => {
			// テスト用のマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// 異なるキャストIDで回答しようとする
			await expect(
				soloMatchingService.respondToSoloMatching(
					matching.id,
					'seed-user-cast-002',
					'accepted',
				),
			).rejects.toThrow('このマッチングに回答する権限がありません')

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('既に回答済みのマッチングにはエラーを投げる', async () => {
			// テスト用のマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// 最初の回答
			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// 2回目の回答はエラー
			await expect(
				soloMatchingService.respondToSoloMatching(
					matching.id,
					'seed-user-cast-001',
					'rejected',
				),
			).rejects.toThrow('このマッチングは既に回答済みです')

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})
	})

	describe('startSoloMatching', () => {
		it('accepted状態のマッチングを開始できる', async () => {
			// テスト用のマッチングを作成して承認済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120, // 2時間
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// マッチングを承認済みにする
			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// マッチングを開始
			const result = await soloMatchingService.startSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// ステータスがin_progressに更新されていることを確認
			expect(result.status).toBe('in_progress')
			expect(result.startedAt).toBeDefined()
			expect(result.scheduledEndAt).toBeDefined()

			// startedAtとscheduledEndAtの差が120分（proposedDuration）であることを確認
			if (result.startedAt && result.scheduledEndAt) {
				const diffMinutes = Math.round(
					(result.scheduledEndAt.getTime() - result.startedAt.getTime()) /
						(1000 * 60),
				)
				expect(diffMinutes).toBe(120)
			}

			// DBに実際に更新されているか検証
			const dbRecord = await db
				.select()
				.from(soloMatchings)
				.where(eq(soloMatchings.id, matching.id))
				.limit(1)

			expect(dbRecord[0].status).toBe('in_progress')
			expect(dbRecord[0].startedAt).toBeDefined()
			expect(dbRecord[0].scheduledEndAt).toBeDefined()

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('マッチングが見つからない場合はエラーを投げる', async () => {
			await expect(
				soloMatchingService.startSoloMatching(
					'non-existent-matching-id',
					'seed-user-cast-001',
				),
			).rejects.toThrow('マッチングが見つかりません')
		})

		it('キャストIDが一致しない場合はエラーを投げる', async () => {
			// テスト用のマッチングを作成して承認済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// 異なるキャストIDで開始しようとする
			await expect(
				soloMatchingService.startSoloMatching(
					matching.id,
					'seed-user-cast-002',
				),
			).rejects.toThrow('このマッチングを開始する権限がありません')

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('accepted状態でない場合はエラーを投げる（pending）', async () => {
			// テスト用のマッチングを作成（pending状態のまま）
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// pending状態で開始しようとする
			await expect(
				soloMatchingService.startSoloMatching(
					matching.id,
					'seed-user-cast-001',
				),
			).rejects.toThrow(
				'このマッチングは開始できません（成立済みマッチングのみ開始可能です）',
			)

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})
	})

	describe('completeSoloMatching', () => {
		it('in_progress状態のマッチングを終了できる', async () => {
			// テスト用のマッチングを作成して開始済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120, // 2時間
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// マッチングを承認済みにする
			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// マッチングを開始
			await soloMatchingService.startSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// マッチングを終了
			const result = await soloMatchingService.completeSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// ステータスがcompletedに更新されていることを確認
			expect(result.status).toBe('completed')
			expect(result.actualEndAt).toBeDefined()

			// DBに実際に更新されているか検証
			const dbRecord = await db
				.select()
				.from(soloMatchings)
				.where(eq(soloMatchings.id, matching.id))
				.limit(1)

			expect(dbRecord[0].status).toBe('completed')
			expect(dbRecord[0].actualEndAt).toBeDefined()

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('マッチングが見つからない場合はエラーを投げる', async () => {
			await expect(
				soloMatchingService.completeSoloMatching(
					'non-existent-matching-id',
					'seed-user-cast-001',
				),
			).rejects.toThrow('マッチングが見つかりません')
		})

		it('キャストIDが一致しない場合はエラーを投げる', async () => {
			// テスト用のマッチングを作成して開始済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			await soloMatchingService.startSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// 異なるキャストIDで終了しようとする
			await expect(
				soloMatchingService.completeSoloMatching(
					matching.id,
					'seed-user-cast-002',
				),
			).rejects.toThrow('このマッチングを終了する権限がありません')

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('in_progress状態でない場合はエラーを投げる（accepted）', async () => {
			// テスト用のマッチングを作成して承認済み（開始前）にする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// accepted状態で終了しようとする
			await expect(
				soloMatchingService.completeSoloMatching(
					matching.id,
					'seed-user-cast-001',
				),
			).rejects.toThrow(
				'このマッチングは終了できません（進行中のマッチングのみ終了可能です）',
			)

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('in_progress状態でない場合はエラーを投げる（pending）', async () => {
			// テスト用のマッチングを作成（pending状態のまま）
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// pending状態で終了しようとする
			await expect(
				soloMatchingService.completeSoloMatching(
					matching.id,
					'seed-user-cast-001',
				),
			).rejects.toThrow(
				'このマッチングは終了できません（進行中のマッチングのみ終了可能です）',
			)

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})
	})

	describe('extendSoloMatching', () => {
		it('in_progress状態のマッチングを延長できる', async () => {
			// テスト用のマッチングを作成して開始済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120, // 2時間
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			// マッチングを承認済みにする
			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// マッチングを開始
			const startedMatching = await soloMatchingService.startSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// マッチングを延長（30分）
			const result = await soloMatchingService.extendSoloMatching(
				matching.id,
				'seed-user-guest-001',
				30,
			)

			// ステータスがin_progressのままであることを確認
			expect(result.status).toBe('in_progress')
			// 延長時間が記録されていることを確認
			expect(result.extensionMinutes).toBe(30)
			// 延長ポイントが計算されていることを確認（30分 × 3000円/時 = 1500ポイント）
			expect(result.extensionPoints).toBe(1500)
			// 合計ポイントが更新されていることを確認（6000 + 1500 = 7500ポイント）
			expect(result.totalPoints).toBe(7500)
			// 予定終了時刻が30分延長されていることを確認
			if (startedMatching.scheduledEndAt && result.scheduledEndAt) {
				const diffMinutes = Math.round(
					(result.scheduledEndAt.getTime() -
						startedMatching.scheduledEndAt.getTime()) /
						(1000 * 60),
				)
				expect(diffMinutes).toBe(30)
			}

			// DBに実際に更新されているか検証
			const dbRecord = await db
				.select()
				.from(soloMatchings)
				.where(eq(soloMatchings.id, matching.id))
				.limit(1)

			expect(dbRecord[0].extensionMinutes).toBe(30)
			expect(dbRecord[0].extensionPoints).toBe(1500)
			expect(dbRecord[0].totalPoints).toBe(7500)

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('延長を複数回実行すると累積される', async () => {
			// テスト用のマッチングを作成して開始済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120, // 2時間
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			await soloMatchingService.startSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// 1回目の延長（30分）
			await soloMatchingService.extendSoloMatching(
				matching.id,
				'seed-user-guest-001',
				30,
			)

			// 2回目の延長（60分）
			const result = await soloMatchingService.extendSoloMatching(
				matching.id,
				'seed-user-guest-001',
				60,
			)

			// 延長時間が累積されていることを確認（30 + 60 = 90分）
			expect(result.extensionMinutes).toBe(90)
			// 延長ポイントが累積されていることを確認（1500 + 3000 = 4500ポイント）
			expect(result.extensionPoints).toBe(4500)
			// 合計ポイントが更新されていることを確認（6000 + 4500 = 10500ポイント）
			expect(result.totalPoints).toBe(10500)

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('マッチングが見つからない場合はエラーを投げる', async () => {
			await expect(
				soloMatchingService.extendSoloMatching(
					'non-existent-matching-id',
					'seed-user-guest-001',
					30,
				),
			).rejects.toThrow('マッチングが見つかりません')
		})

		it('ゲストIDが一致しない場合はエラーを投げる', async () => {
			// テスト用のマッチングを作成して開始済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			await soloMatchingService.startSoloMatching(
				matching.id,
				'seed-user-cast-001',
			)

			// 異なるゲストIDで延長しようとする
			await expect(
				soloMatchingService.extendSoloMatching(
					matching.id,
					'seed-user-guest-002',
					30,
				),
			).rejects.toThrow('このマッチングを延長する権限がありません')

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})

		it('in_progress状態でない場合はエラーを投げる（accepted）', async () => {
			// テスト用のマッチングを作成して承認済み（開始前）にする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			})

			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-001',
				'accepted',
			)

			// accepted状態で延長しようとする
			await expect(
				soloMatchingService.extendSoloMatching(
					matching.id,
					'seed-user-guest-001',
					30,
				),
			).rejects.toThrow(
				'このマッチングは延長できません（進行中のマッチングのみ延長可能です）',
			)

			// クリーンアップのためIDにプレフィックスを追加
			await db
				.update(soloMatchings)
				.set({ id: `${TEST_PREFIX}${matching.id}` })
				.where(eq(soloMatchings.id, matching.id))
		})
	})
})
