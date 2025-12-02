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
import { matchings, matchingParticipants } from '@/libs/db/schema'
import { soloMatchingService } from '@/features/solo-matching/services/soloMatchingService'

// 新規作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-solo-matching-service-'

// 新規作成したデータのクリーンアップ
async function cleanupTestData() {
	// LIKE演算子でテストプレフィックスに一致するマッチングを検索して削除
	// 注: matching_participantsはmatchingsにcascade deleteが設定されているので自動的に削除される
	const testMatchings = await db
		.select({ id: matchings.id })
		.from(matchings)
		.where(like(matchings.id, `${TEST_PREFIX}%`))

	for (const { id } of testMatchings) {
		await db.delete(matchings).where(eq(matchings.id, id))
	}
}

// マッチングをテストプレフィックス付きIDに更新する（クリーンアップ用）
async function markForCleanup(matchingId: string) {
	// 参加者テーブルも更新する必要がある
	const [participant] = await db
		.select()
		.from(matchingParticipants)
		.where(eq(matchingParticipants.matchingId, matchingId))

	if (participant) {
		// まず参加者を削除
		await db
			.delete(matchingParticipants)
			.where(eq(matchingParticipants.matchingId, matchingId))
	}

	// マッチングIDを更新
	const newMatchingId = `${TEST_PREFIX}${matchingId}`
	await db
		.update(matchings)
		.set({ id: newMatchingId })
		.where(eq(matchings.id, matchingId))

	// 参加者を再作成
	if (participant) {
		await db.insert(matchingParticipants).values({
			id: `${TEST_PREFIX}${participant.id}`,
			matchingId: newMatchingId,
			castId: participant.castId,
			status: participant.status,
			respondedAt: participant.respondedAt,
			joinedAt: participant.joinedAt,
		})
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
			})

			// 戻り値の検証
			expect(result).toBeDefined()
			expect(result.guestId).toBe('seed-user-guest-001')
			expect(result.castId).toBe('seed-user-cast-001')
			expect(result.proposedDuration).toBe(120)
			expect(result.proposedLocation).toBe('渋谷')
			// 時給はキャストのランクから自動計算される（seed-user-cast-001はランク1 = 3000ポイント/時間）
			expect(result.totalPoints).toBe(6000) // 2時間 × 3000円/時
			expect(result.status).toBe('pending')
			expect(result.chatRoomId).toBeNull()

			// DBに実際に作成されているか検証（matchingsテーブル）
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, result.id))
				.limit(1)

			expect(dbMatching).toBeDefined()
			expect(dbMatching.guestId).toBe('seed-user-guest-001')
			expect(dbMatching.type).toBe('solo')
			expect(dbMatching.totalPoints).toBe(6000)

			// DBに実際に作成されているか検証（matching_participantsテーブル）
			const [dbParticipant] = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, result.id))
				.limit(1)

			expect(dbParticipant).toBeDefined()
			expect(dbParticipant.castId).toBe('seed-user-cast-001')
			expect(dbParticipant.status).toBe('pending')

			// クリーンアップ
			await markForCleanup(result.id)
		})

		it('合計ポイントが正しく計算される（30分の場合）', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate,
				proposedDuration: 30, // 30分
				proposedLocation: '新宿',
			})

			// 30分 = 0.5時間 → 0.5 × 3000（ランク1の時給） = 1500ポイント
			expect(result.totalPoints).toBe(1500)

			// クリーンアップ
			await markForCleanup(result.id)
		})

		it('合計ポイントが正しく計算される（3時間30分の場合）', async () => {
			const proposedDate = new Date(Date.now() + 86400000)

			const result = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate,
				proposedDuration: 210, // 3時間30分
				proposedLocation: '池袋',
			})

			// 3.5時間 × 3000（ランク1の時給） = 10500ポイント
			expect(result.totalPoints).toBe(10500)

			// クリーンアップ
			await markForCleanup(result.id)
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
			// seed.sqlのデータで確認
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

			// seed-user-guest-001には最低6件（通常4件 + 完了済み2件）、seed-user-guest-002には最低1件のマッチングがある
			// テスト実行中に作成されたマッチングも含まれる可能性があるため、最低値で検証
			expect(results1.length).toBeGreaterThanOrEqual(6)
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
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, matching.id))
				.limit(1)

			expect(dbMatching.status).toBe('accepted')
			expect(dbMatching.recruitingEndedAt).toBeDefined()

			// 参加者テーブルも更新されているか確認
			const [dbParticipant] = await db
				.select()
				.from(matchingParticipants)
				.where(eq(matchingParticipants.matchingId, matching.id))
				.limit(1)

			expect(dbParticipant.status).toBe('accepted')
			expect(dbParticipant.respondedAt).toBeDefined()

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('キャストがマッチングを拒否できる', async () => {
			// テスト用のマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
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
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, matching.id))
				.limit(1)

			expect(dbMatching.status).toBe('rejected')

			// クリーンアップ
			await markForCleanup(matching.id)
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
			})

			// 異なるキャストIDで回答しようとする
			await expect(
				soloMatchingService.respondToSoloMatching(
					matching.id,
					'seed-user-cast-002',
					'accepted',
				),
			).rejects.toThrow('このマッチングに回答する権限がありません')

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('既に回答済みのマッチングにはエラーを投げる', async () => {
			// テスト用のマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
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

			// クリーンアップ
			await markForCleanup(matching.id)
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
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, matching.id))
				.limit(1)

			expect(dbMatching.status).toBe('in_progress')
			expect(dbMatching.startedAt).toBeDefined()
			expect(dbMatching.scheduledEndAt).toBeDefined()

			// クリーンアップ
			await markForCleanup(matching.id)
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

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('accepted状態でない場合はエラーを投げる（pending）', async () => {
			// テスト用のマッチングを作成（pending状態のまま）
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
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

			// クリーンアップ
			await markForCleanup(matching.id)
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
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, matching.id))
				.limit(1)

			expect(dbMatching.status).toBe('completed')
			expect(dbMatching.actualEndAt).toBeDefined()

			// クリーンアップ
			await markForCleanup(matching.id)
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

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('in_progress状態でない場合はエラーを投げる（accepted）', async () => {
			// テスト用のマッチングを作成して承認済み（開始前）にする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
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

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('in_progress状態でない場合はエラーを投げる（pending）', async () => {
			// テスト用のマッチングを作成（pending状態のまま）
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
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

			// クリーンアップ
			await markForCleanup(matching.id)
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
			const [dbMatching] = await db
				.select()
				.from(matchings)
				.where(eq(matchings.id, matching.id))
				.limit(1)

			expect(dbMatching.extensionMinutes).toBe(30)
			expect(dbMatching.extensionPoints).toBe(1500)
			expect(dbMatching.totalPoints).toBe(7500)

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('延長を複数回実行すると累積される', async () => {
			// テスト用のマッチングを作成して開始済みにする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120, // 2時間
				proposedLocation: '渋谷',
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

			// クリーンアップ
			await markForCleanup(matching.id)
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

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('in_progress状態でない場合はエラーを投げる（accepted）', async () => {
			// テスト用のマッチングを作成して承認済み（開始前）にする
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
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

			// クリーンアップ
			await markForCleanup(matching.id)
		})
	})

	describe('getPendingOfferForCast', () => {
		it('pendingオファーがある場合はオファーを返す', async () => {
			// テスト用のpendingマッチングを作成
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-001',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// pendingオファーを取得
			const result = await soloMatchingService.getPendingOfferForCast(
				'seed-user-guest-001',
				'seed-user-cast-001',
			)

			// オファーが取得できることを確認
			expect(result).not.toBeNull()
			expect(result?.guestId).toBe('seed-user-guest-001')
			expect(result?.castId).toBe('seed-user-cast-001')
			expect(result?.status).toBe('pending')

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('pendingオファーがない場合はnullを返す', async () => {
			// 存在しない組み合わせで検索
			const result = await soloMatchingService.getPendingOfferForCast(
				'non-existent-guest-id',
				'non-existent-cast-id',
			)

			expect(result).toBeNull()
		})

		it('acceptedオファーはpendingとして取得されない', async () => {
			// シードデータと競合しない組み合わせを使用
			// seed-user-guest-001/seed-user-cast-003 はシードデータにpendingマッチングがない
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-001',
				castId: 'seed-user-cast-003',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// マッチングを承認済みにする
			await soloMatchingService.respondToSoloMatching(
				matching.id,
				'seed-user-cast-003',
				'accepted',
			)

			// pendingオファーを取得（acceptedなので取得されないはず）
			const result = await soloMatchingService.getPendingOfferForCast(
				'seed-user-guest-001',
				'seed-user-cast-003',
			)

			// acceptedのオファーはpendingではないのでnull
			expect(result).toBeNull()

			// クリーンアップ
			await markForCleanup(matching.id)
		})

		it('異なるゲスト・キャストの組み合わせでは取得されない', async () => {
			// シードデータと競合しない組み合わせを使用
			// seed-user-guest-002/seed-user-cast-004 はシードデータにpendingマッチングがない
			const matching = await soloMatchingService.createSoloMatching({
				guestId: 'seed-user-guest-002',
				castId: 'seed-user-cast-004',
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
			})

			// 異なるゲストIDで検索（シードデータにも該当なし）
			// guest-003/cast-004 はシードデータにpendingマッチングがない
			const result1 = await soloMatchingService.getPendingOfferForCast(
				'seed-user-guest-003',
				'seed-user-cast-004',
			)
			expect(result1).toBeNull()

			// 異なるキャストIDで検索（シードデータにも該当なし）
			// guest-002/cast-005 はシードデータにpendingマッチングがない
			const result2 = await soloMatchingService.getPendingOfferForCast(
				'seed-user-guest-002',
				'seed-user-cast-005',
			)
			expect(result2).toBeNull()

			// クリーンアップ
			await markForCleanup(matching.id)
		})
	})
})
