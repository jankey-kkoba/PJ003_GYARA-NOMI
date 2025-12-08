/**
 * photoService Integration テスト
 *
 * ローカルSupabaseを使用してphotoServiceのDB操作を検証
 * seed.sqlで用意されたテストデータを使用
 *
 * 前提条件:
 * - supabase db reset を実行してseed.sqlが適用されていること
 * - seed.sqlで定義されたキャストデータが存在すること
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/libs/db'
import { castProfilePhotos } from '@/libs/db/schema/cast-profile-photos'
import { photoService } from '@/features/cast-profile-photo/services/photoService'
import { eq, like } from 'drizzle-orm'

// 新規作成データのプレフィックス（クリーンアップ用）
const TEST_PREFIX = 'test-photo-service-'

// 新規作成したデータのクリーンアップ
async function cleanupTestData() {
	const testPhotos = await db
		.select({ id: castProfilePhotos.id })
		.from(castProfilePhotos)
		.where(like(castProfilePhotos.id, `${TEST_PREFIX}%`))

	for (const { id } of testPhotos) {
		await db.delete(castProfilePhotos).where(eq(castProfilePhotos.id, id))
	}
}

describe('photoService (integration)', () => {
	beforeEach(async () => {
		await cleanupTestData()
	})

	afterEach(async () => {
		await cleanupTestData()
	})

	describe('getPhotosByCastId', () => {
		it('キャストのプロフィール写真一覧を取得できる (seed data)', async () => {
			// seed.sqlで用意されたキャスト（3枚の写真）
			const photos = await photoService.getPhotosByCastId('seed-user-cast-001')

			expect(photos).toHaveLength(3)
			expect(photos[0].displayOrder).toBe(0)
			expect(photos[1].displayOrder).toBe(1)
			expect(photos[2].displayOrder).toBe(2)
		})

		it('表示順でソートされている (seed data)', async () => {
			const photos = await photoService.getPhotosByCastId('seed-user-cast-001')

			expect(photos[0].photoUrl).toBe('seed-user-cast-001/photo1.jpg')
			expect(photos[1].photoUrl).toBe('seed-user-cast-001/photo2.jpg')
			expect(photos[2].photoUrl).toBe('seed-user-cast-001/photo3.jpg')
		})

		it('写真がない場合は空配列を返す (seed data)', async () => {
			// seed-user-cast-003は写真なし
			const photos = await photoService.getPhotosByCastId('seed-user-cast-003')
			expect(photos).toEqual([])
		})
	})

	describe('createPhoto', () => {
		it('プロフィール写真を作成できる', async () => {
			const photo = await photoService.createPhoto({
				castProfileId: 'seed-user-cast-003',
				photoUrl: 'seed-user-cast-003/new-photo.jpg',
				displayOrder: 0,
			})

			expect(photo).toMatchObject({
				castProfileId: 'seed-user-cast-003',
				photoUrl: 'seed-user-cast-003/new-photo.jpg',
				displayOrder: 0,
			})
			expect(photo.id).toBeDefined()
			expect(typeof photo.createdAt).toBe('string')
			expect(typeof photo.updatedAt).toBe('string')
		})
	})

	describe('updatePhoto', () => {
		it('プロフィール写真の表示順を更新できる (seed data)', async () => {
			// seed.sqlで用意された写真を更新
			const updatedPhoto = await photoService.updatePhoto(
				'seed-photo-cast-001-1',
				{
					displayOrder: 5,
				},
			)

			expect(updatedPhoto.displayOrder).toBe(5)
			expect(updatedPhoto.id).toBe('seed-photo-cast-001-1')

			// 元に戻す
			await photoService.updatePhoto('seed-photo-cast-001-1', {
				displayOrder: 0,
			})
		})

		it('存在しない写真を更新しようとするとエラーになる', async () => {
			await expect(
				photoService.updatePhoto('non-existent-id', { displayOrder: 1 }),
			).rejects.toThrow('プロフィール写真が見つかりません')
		})
	})

	describe('deletePhoto', () => {
		it('プロフィール写真を削除できる', async () => {
			// テスト用の写真を作成
			const photo = await photoService.createPhoto({
				castProfileId: 'seed-user-cast-003',
				photoUrl: 'seed-user-cast-003/temp-photo.jpg',
				displayOrder: 0,
			})

			await photoService.deletePhoto(photo.id)

			const photos = await photoService.getPhotosByCastId('seed-user-cast-003')
			expect(photos.find((p) => p.id === photo.id)).toBeUndefined()
		})
	})

	describe('deletePhotosByCastId', () => {
		it('特定のキャストの写真を全て削除できる', async () => {
			// テスト用の写真を2枚作成
			await photoService.createPhoto({
				castProfileId: 'seed-user-cast-003',
				photoUrl: 'seed-user-cast-003/temp1.jpg',
				displayOrder: 0,
			})
			await photoService.createPhoto({
				castProfileId: 'seed-user-cast-003',
				photoUrl: 'seed-user-cast-003/temp2.jpg',
				displayOrder: 1,
			})

			await photoService.deletePhotosByCastId('seed-user-cast-003')

			const photos = await photoService.getPhotosByCastId('seed-user-cast-003')
			expect(photos).toHaveLength(0)
		})
	})

	describe('getPhotoCount', () => {
		it('プロフィール写真の枚数を取得できる (seed data)', async () => {
			const count = await photoService.getPhotoCount('seed-user-cast-001')
			expect(count).toBe(3)
		})

		it('写真がない場合は0を返す (seed data)', async () => {
			const count = await photoService.getPhotoCount('seed-user-cast-003')
			expect(count).toBe(0)
		})
	})

	describe('getNextDisplayOrder', () => {
		it('次の表示順序を取得できる (seed data)', async () => {
			// seed-user-cast-001は3枚の写真（0,1,2）
			const nextOrder =
				await photoService.getNextDisplayOrder('seed-user-cast-001')
			expect(nextOrder).toBe(3)
		})

		it('写真がない場合は0を返す (seed data)', async () => {
			const nextOrder =
				await photoService.getNextDisplayOrder('seed-user-cast-003')
			expect(nextOrder).toBe(0)
		})
	})
})
