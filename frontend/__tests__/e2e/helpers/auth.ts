import { Page } from '@playwright/test'

/**
 * e2eテスト用の認証ヘルパー
 * 開発環境のCredentialsプロバイダーを使用してログイン
 */

/**
 * 開発環境でのテスト用ユーザーメールアドレス
 */
export const TEST_USERS = {
	guest: {
		email: 'test-guest@example.com',
		password: 'dev-password-2024',
		role: 'guest' as const,
	},
	cast: {
		email: 'test-cast@example.com',
		password: 'dev-password-2024',
		role: 'cast' as const,
	},
}

/**
 * 開発環境用のCredentialsログインを実行
 * カスタムログインページ（/login）の開発環境用フォームを使用
 * @param page - Playwrightのページオブジェクト
 * @param userType - ログインするユーザータイプ（'guest' または 'cast'）
 */
export async function loginAsTestUser(
	page: Page,
	userType: 'guest' | 'cast',
): Promise<void> {
	const user = TEST_USERS[userType]

	// カスタムログインページに移動
	await page.goto('/login')

	// 開発環境用フォームの入力フィールドを取得
	const emailInput = page.locator('input#credentials-email')
	const passwordInput = page.locator('input#credentials-password')
	const submitButton = page.locator('button[type="submit"]').first()

	// メールアドレスとパスワードを入力
	await emailInput.fill(user.email)
	await passwordInput.fill(user.password)

	// ログインボタンをクリックしてナビゲーションを待機
	await Promise.all([
		page.waitForURL('/', { timeout: 10000 }),
		submitButton.click(),
	])

	// ページが完全に読み込まれるまで待機
	await page.waitForLoadState('networkidle')
}

/**
 * ゲストユーザーとしてログイン
 */
export async function loginAsGuest(page: Page): Promise<void> {
	await loginAsTestUser(page, 'guest')
}

/**
 * キャストユーザーとしてログイン
 */
export async function loginAsCast(page: Page): Promise<void> {
	await loginAsTestUser(page, 'cast')
}

/**
 * ログアウト
 */
export async function logout(page: Page): Promise<void> {
	// ログアウトAPIを直接呼び出し
	await page.goto('/api/auth/signout')
	await page.locator('form').locator('button[type="submit"]').click()
	await page.waitForURL('/login', { timeout: 5000 })
}
