/**
 * Protected Routes E2Eテスト
 *
 * 認証による保護されたルートへのアクセス制御を検証
 * - 未認証ユーザーのリダイレクト
 * - 公開ルートへのアクセス
 * - ページ間のナビゲーション
 */

import { test, expect } from '@playwright/test'

test.describe('Protected Routes', () => {
	test.describe('未認証ユーザーのリダイレクト', () => {
		test('保護されたルート（ホーム）にアクセスするとログインページにリダイレクトされる', async ({
			page,
		}) => {
			await page.goto('/')

			// ログインページにリダイレクトされることを確認
			await expect(page).toHaveURL('/login')
			await expect(
				page.getByRole('heading', { name: 'ギャラ飲みプラットフォーム' }),
			).toBeVisible()
		})
	})

	test.describe('公開ルートへのアクセス', () => {
		test('ログインページは認証なしでアクセス可能', async ({ page }) => {
			await page.goto('/login')

			await expect(page).toHaveURL('/login')
			await expect(
				page.getByRole('heading', { name: 'ギャラ飲みプラットフォーム' }),
			).toBeVisible()
			await expect(page.getByText('LINEでログイン')).toBeVisible()
		})

		test('typeパラメータなしの /sign-up はログインページにリダイレクトされる', async ({
			page,
		}) => {
			await page.goto('/sign-up')

			// ログインページにリダイレクトされる
			await expect(page).toHaveURL('/login')
		})
	})

	test.describe('ナビゲーション', () => {
		test('ログインページにゲスト登録リンクが表示される', async ({ page }) => {
			await page.goto('/login')

			// ゲスト登録リンクが表示される
			await expect(
				page.getByRole('link', { name: /ゲストとして登録/ }),
			).toBeVisible()
		})

		test('ログインページにキャスト登録リンクが表示される', async ({ page }) => {
			await page.goto('/login')

			// キャスト登録リンクが表示される
			await expect(
				page.getByRole('link', { name: /キャストとして登録/ }),
			).toBeVisible()
		})

		test('利用規約リンクが表示される', async ({ page }) => {
			await page.goto('/login')

			await expect(page.getByRole('link', { name: '利用規約' })).toBeVisible()
		})

		test('プライバシーポリシーリンクが表示される', async ({ page }) => {
			await page.goto('/login')

			await expect(
				page.getByRole('link', { name: 'プライバシーポリシー' }),
			).toBeVisible()
		})
	})
})
