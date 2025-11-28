/**
 * ホーム画面ナビゲーション E2Eテスト
 *
 * ホーム画面からの遷移フローを検証
 * - キャスト一覧への遷移
 */

import { test, expect } from '@playwright/test'
import { loginAsGuest } from '@tests/e2e/helpers/auth'

test.describe('Home Navigation', () => {
	test.describe('ゲストユーザーとしてログイン済みの場合', () => {
		test.beforeEach(async ({ page }) => {
			// ゲストユーザーとしてログイン（Credentialsプロバイダー使用）
			await loginAsGuest(page)
		})

		test('ホーム画面からキャスト一覧に遷移できる', async ({ page }) => {
			// ホーム画面に移動
			await page.goto('/')

			// キャスト一覧へのリンクをクリック
			await page.getByRole('link', { name: 'キャスト一覧を見る' }).click()

			// キャスト一覧ページに遷移することを確認
			await expect(page).toHaveURL('/casts')
		})
	})
})
