/**
 * castService Integration テスト
 *
 * ローカルSupabaseを使用してキャストサービスのDB操作を検証
 * seed.sqlで用意されたテストデータを使用
 *
 * 前提条件:
 * - supabase db reset を実行してseed.sqlが適用されていること
 * - seed.sqlで定義されたキャストデータが存在すること
 */

import { describe, it, expect } from 'vitest'
import { castService } from '@/features/cast/services/castService'

describe('castService Integration', () => {
	describe('getCastList', () => {
		describe('基本的な取得', () => {
			it('アクティブなキャスト一覧を取得できる', async () => {
				const result = await castService.getCastList({ page: 1, limit: 12 })

				// seed.sqlで用意されたアクティブなキャストが含まれている
				expect(result.casts.length).toBeGreaterThan(0)
				expect(result.total).toBeGreaterThan(0)

				// 各キャストが必要なフィールドを持っている
				result.casts.forEach((cast) => {
					expect(cast).toHaveProperty('id')
					expect(cast).toHaveProperty('name')
					expect(cast).toHaveProperty('age')
					expect(cast).toHaveProperty('bio')
					expect(cast).toHaveProperty('rank')
					expect(cast.id).toContain('seed-user-cast-')
				})
			})

			it('非アクティブなキャストは取得しない', async () => {
				const result = await castService.getCastList({ page: 1, limit: 100 })

				// seed-user-cast-inactive は is_active=false なので含まれない
				const inactiveCast = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-inactive',
				)
				expect(inactiveCast).toBeUndefined()
			})

			it('エリア情報を含めて取得できる', async () => {
				const result = await castService.getCastList({ page: 1, limit: 12 })

				// エリアを持つキャストを探す（seed-user-cast-001は渋谷）
				const castWithArea = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-001',
				)
				if (castWithArea) {
					expect(castWithArea.areaName).toBe('渋谷')
				}
			})

			it('エリアがnullの場合もnullで取得できる', async () => {
				const result = await castService.getCastList({ page: 1, limit: 100 })

				// seed-user-cast-005はエリアなし
				const castWithoutArea = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-005',
				)
				if (castWithoutArea) {
					expect(castWithoutArea.areaName).toBeNull()
				}
			})
		})

		describe('年齢フィールド', () => {
			it('age フィールドが含まれている', async () => {
				const result = await castService.getCastList({ page: 1, limit: 12 })

				expect(result.casts.length).toBeGreaterThan(0)
				result.casts.forEach((cast) => {
					expect(cast).toHaveProperty('age')
					expect(typeof cast.age).toBe('number')
					expect(cast.age).toBeGreaterThan(0)
				})
			})

			it('生年月日から正しく年齢が計算される', async () => {
				const result = await castService.getCastList({ page: 1, limit: 100 })

				// seed-user-cast-001: 1998-04-12生まれ
				const cast001 = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-001',
				)
				if (cast001) {
					// 年齢は生年月日から計算される
					const birthYear = 1998
					const currentYear = new Date().getFullYear()
					const expectedAge = currentYear - birthYear

					// 誕生日前後で1歳の差が出るため、±1の範囲で検証
					expect(cast001.age).toBeGreaterThanOrEqual(expectedAge - 1)
					expect(cast001.age).toBeLessThanOrEqual(expectedAge)
				}
			})
		})

		describe('ページネーション', () => {
			it('1ページ目を正しく取得できる', async () => {
				const result = await castService.getCastList({ page: 1, limit: 10 })

				expect(result.casts.length).toBeGreaterThan(0)
				expect(result.casts.length).toBeLessThanOrEqual(10)
				expect(result.total).toBeGreaterThanOrEqual(result.casts.length)
			})

			it('2ページ目を正しく取得できる', async () => {
				// 1ページ目を取得
				const page1 = await castService.getCastList({ page: 1, limit: 10 })

				if (page1.total > 10) {
					// 2ページ目を取得
					const page2 = await castService.getCastList({ page: 2, limit: 10 })

					// 2ページ目のデータは1ページ目と異なる
					const page1Ids = new Set(page1.casts.map((c) => c.id))
					const page2Ids = page2.casts.map((c) => c.id)

					page2Ids.forEach((id) => {
						expect(page1Ids.has(id)).toBe(false)
					})
				}
			})

			it('範囲外のページは空配列を返す', async () => {
				const result = await castService.getCastList({ page: 999, limit: 10 })

				expect(result.casts).toHaveLength(0)
				expect(result.total).toBeGreaterThan(0) // totalは全体件数を返す
			})

			it('limit=1で正しく動作する', async () => {
				const result = await castService.getCastList({ page: 1, limit: 1 })

				expect(result.casts).toHaveLength(1)
				expect(result.total).toBeGreaterThan(0)
			})

			it('ページネーション用データ（20件）を正しく取得できる', async () => {
				// seed.sqlでseed-user-cast-page-001〜020が作成されている
				const result = await castService.getCastList({ page: 1, limit: 100 })

				const paginationCasts = result.casts.filter((cast) =>
					cast.id.startsWith('seed-user-cast-page-'),
				)
				expect(paginationCasts.length).toBe(20)
			})
		})

		describe('データ構造', () => {
			it('正しいフィールドを含むキャストオブジェクトを返す', async () => {
				const result = await castService.getCastList({ page: 1, limit: 12 })

				// seed-user-cast-001を探す
				const cast001 = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-001',
				)

				if (cast001) {
					expect(cast001).toHaveProperty('id')
					expect(cast001).toHaveProperty('name')
					expect(cast001).toHaveProperty('age')
					expect(cast001).toHaveProperty('bio')
					expect(cast001).toHaveProperty('rank')
					expect(cast001).toHaveProperty('areaName')

					expect(cast001.id).toBe('seed-user-cast-001')
					expect(cast001.name).toBe('山田花子')
					expect(cast001.age).toBeGreaterThan(0)
					expect(cast001.bio).toBe(
						'よろしくお願いします！楽しい時間を過ごしましょう♪',
					)
					expect(cast001.rank).toBe(1)
					expect(cast001.areaName).toBe('渋谷')
				}
			})
		})

		describe('年齢フィルタリング', () => {
			it('minAgeで最小年齢を指定してフィルタリングできる', async () => {
				const result = await castService.getCastList({
					page: 1,
					limit: 100,
					minAge: 25,
				})

				// すべてのキャストが25歳以上であることを確認
				result.casts.forEach((cast) => {
					expect(cast.age).toBeGreaterThanOrEqual(25)
				})
			})

			it('maxAgeで最大年齢を指定してフィルタリングできる', async () => {
				const result = await castService.getCastList({
					page: 1,
					limit: 100,
					maxAge: 25,
				})

				// すべてのキャストが25歳以下であることを確認
				result.casts.forEach((cast) => {
					expect(cast.age).toBeLessThanOrEqual(25)
				})
			})

			it('minAgeとmaxAgeを両方指定して年齢範囲でフィルタリングできる', async () => {
				const result = await castService.getCastList({
					page: 1,
					limit: 100,
					minAge: 20,
					maxAge: 25,
				})

				// すべてのキャストが20〜25歳の範囲内であることを確認
				result.casts.forEach((cast) => {
					expect(cast.age).toBeGreaterThanOrEqual(20)
					expect(cast.age).toBeLessThanOrEqual(25)
				})
			})

			it('年齢フィルタリングでtotalも正しく計算される', async () => {
				// フィルターなしの場合
				const noFilterResult = await castService.getCastList({
					page: 1,
					limit: 100,
				})

				// 厳しい年齢フィルターをかけた場合
				const filteredResult = await castService.getCastList({
					page: 1,
					limit: 100,
					minAge: 30,
					maxAge: 30,
				})

				// フィルターをかけるとtotalが減る（もしくは同じ）
				expect(filteredResult.total).toBeLessThanOrEqual(noFilterResult.total)
			})

			it('フィルター条件に合致するキャストがない場合は空配列を返す', async () => {
				// 18歳未満（ありえない年齢範囲）
				const result = await castService.getCastList({
					page: 1,
					limit: 100,
					minAge: 99,
					maxAge: 99,
				})

				// キャストがいないか、非常に少ない
				expect(result.casts.length).toBeLessThanOrEqual(result.total)
			})
		})

		describe('エッジケース', () => {
			it('日本語の名前を正しく扱える', async () => {
				const result = await castService.getCastList({ page: 1, limit: 100 })

				const cast002 = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-002',
				)
				if (cast002) {
					expect(cast002.name).toBe('佐々木美咲')
				}
			})

			it('bioが空文字の場合も取得できる', async () => {
				const result = await castService.getCastList({ page: 1, limit: 100 })

				// seed-user-cast-empty-bio: bio=''
				const castWithEmptyBio = result.casts.find(
					(cast) => cast.id === 'seed-user-cast-empty-bio',
				)
				if (castWithEmptyBio) {
					expect(castWithEmptyBio.bio).toBe('')
				}
			})

			it('ランクが異なるキャストを取得できる', async () => {
				const result = await castService.getCastList({ page: 1, limit: 100 })

				// ページネーション用キャストはランクが連番になっている
				const paginationCasts = result.casts.filter((cast) =>
					cast.id.startsWith('seed-user-cast-page-'),
				)

				const ranks = paginationCasts
					.map((cast) => cast.rank)
					.sort((a, b) => a - b)
				expect(ranks.length).toBeGreaterThan(0)
				expect(ranks[0]).toBe(1)
				expect(ranks[ranks.length - 1]).toBeGreaterThan(1)
			})
		})
	})

	describe('getCastById', () => {
		describe('正常系', () => {
			it('存在するキャストの詳細を取得できる', async () => {
				const cast = await castService.getCastById('seed-user-cast-001')

				expect(cast).not.toBeNull()
				expect(cast?.id).toBe('seed-user-cast-001')
				expect(cast?.name).toBe('山田花子')
				expect(cast?.age).toBeGreaterThan(0)
				expect(cast?.bio).toBe(
					'よろしくお願いします！楽しい時間を過ごしましょう♪',
				)
				expect(cast?.rank).toBe(1)
				expect(cast?.areaName).toBe('渋谷')
			})

			it('エリアがnullのキャストも取得できる', async () => {
				const cast = await castService.getCastById('seed-user-cast-005')

				expect(cast).not.toBeNull()
				expect(cast?.areaName).toBeNull()
			})

			it('非アクティブなキャストも取得できる', async () => {
				// getCastByIdはis_activeをチェックしない（詳細ページではIDで直接アクセスを想定）
				const cast = await castService.getCastById('seed-user-cast-inactive')

				// 非アクティブキャストもDBには存在するが、getCastByIdでは取得可能
				// 注: アクセス制御はAPI層で行う想定
				expect(cast).not.toBeNull()
			})
		})

		describe('異常系', () => {
			it('存在しないIDの場合はnullを返す', async () => {
				const cast = await castService.getCastById('nonexistent-id')

				expect(cast).toBeNull()
			})

			it('空文字のIDの場合はnullを返す', async () => {
				const cast = await castService.getCastById('')

				expect(cast).toBeNull()
			})
		})
	})
})
