/**
 * favoriteService Integration テスト
 *
 * ローカルSupabaseを使用してお気に入りサービスのDB操作を検証
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { favoriteService } from '@/features/favorite/services/favoriteService'
import { db } from '@/libs/db'
import { favorites } from '@/libs/db/schema/favorites'
import { eq, and } from 'drizzle-orm'

// テスト用のユーザーID（seed.sqlで作成されたゲストとキャスト）
const GUEST_ID = 'seed-user-guest-001'
const CAST_ID = 'seed-user-cast-001'

describe('favoriteService Integration', () => {
	beforeEach(async () => {
		// テスト前にお気に入りをクリア
		await db
			.delete(favorites)
			.where(
				and(eq(favorites.guestId, GUEST_ID), eq(favorites.castId, CAST_ID)),
			)
	})

	describe('addFavorite', () => {
		it('お気に入りを追加できる', async () => {
			await favoriteService.addFavorite(GUEST_ID, CAST_ID)

			const [result] = await db
				.select()
				.from(favorites)
				.where(
					and(eq(favorites.guestId, GUEST_ID), eq(favorites.castId, CAST_ID)),
				)

			expect(result).toBeDefined()
			expect(result.guestId).toBe(GUEST_ID)
			expect(result.castId).toBe(CAST_ID)
		})

		it('既に存在する場合は何もしない（エラーにならない）', async () => {
			await favoriteService.addFavorite(GUEST_ID, CAST_ID)
			await favoriteService.addFavorite(GUEST_ID, CAST_ID)

			const results = await db
				.select()
				.from(favorites)
				.where(
					and(eq(favorites.guestId, GUEST_ID), eq(favorites.castId, CAST_ID)),
				)

			expect(results).toHaveLength(1)
		})
	})

	describe('removeFavorite', () => {
		it('お気に入りを削除できる', async () => {
			// 先にお気に入りを追加
			await favoriteService.addFavorite(GUEST_ID, CAST_ID)

			// 削除
			await favoriteService.removeFavorite(GUEST_ID, CAST_ID)

			const [result] = await db
				.select()
				.from(favorites)
				.where(
					and(eq(favorites.guestId, GUEST_ID), eq(favorites.castId, CAST_ID)),
				)

			expect(result).toBeUndefined()
		})

		it('存在しないお気に入りを削除してもエラーにならない', async () => {
			await expect(
				favoriteService.removeFavorite(GUEST_ID, CAST_ID),
			).resolves.not.toThrow()
		})
	})

	describe('isFavorite', () => {
		it('お気に入り登録済みの場合はtrueを返す', async () => {
			await favoriteService.addFavorite(GUEST_ID, CAST_ID)

			const result = await favoriteService.isFavorite(GUEST_ID, CAST_ID)

			expect(result).toBe(true)
		})

		it('お気に入り未登録の場合はfalseを返す', async () => {
			const result = await favoriteService.isFavorite(GUEST_ID, CAST_ID)

			expect(result).toBe(false)
		})
	})
})
