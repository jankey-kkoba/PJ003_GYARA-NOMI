import { Page, expect } from '@playwright/test'

/**
 * ソロマッチングE2Eテスト用ヘルパー関数
 */

/**
 * E2Eテスト用キャストID
 * seed.sqlで定義されているE2Eテスト用キャストユーザー
 * ログインユーザー: test-cast@example.com
 */
export const E2E_TEST_CAST_ID = 'seed-user-e2e-cast'

/**
 * キャスト一覧から最初のキャストのIDを取得
 * @param page - Playwrightのページオブジェクト
 * @returns キャストID
 */
export async function getFirstCastId(page: Page): Promise<string> {
	await page.goto('/casts')
	await page.waitForLoadState('networkidle')

	// キャストカードのリンクからcastIdを抽出
	const firstCastLink = page
		.getByRole('link', { name: /のプロフィール$/ })
		.first()
	const href = await firstCastLink.getAttribute('href')
	if (!href) {
		throw new Error('キャストカードのリンクが見つかりません')
	}

	// /casts/[castId] からcastIdを抽出
	const match = href.match(/\/casts\/([^/]+)/)
	if (!match) {
		throw new Error('キャストIDを抽出できません')
	}

	return match[1]
}

/**
 * チャットページでマッチングオファーを送信
 * @param page - Playwrightのページオブジェクト
 * @param castId - キャストID
 * @param options - オファーオプション（省略時はデフォルト値を使用）
 */
export async function sendMatchingOffer(
	page: Page,
	castId: string,
	options?: {
		location?: string
		hourlyRate?: number
	},
): Promise<void> {
	const { location = '渋谷駅周辺', hourlyRate = 3000 } = options ?? {}

	// チャットページに移動
	await page.goto(`/casts/${castId}/chat`)
	await page.waitForLoadState('networkidle')

	// オファーボタンをクリック
	const offerButton = page.getByRole('button', {
		name: 'マッチングオファーを送る',
	})
	await expect(offerButton).toBeVisible()
	await offerButton.click()

	// ダイアログが開くのを待機
	await expect(page.getByRole('dialog')).toBeVisible()

	// 場所を入力
	const locationInput = page.getByLabel('希望場所')
	await locationInput.fill(location)

	// 時給を入力
	const hourlyRateInput = page.getByLabel('時給（ポイント）')
	await hourlyRateInput.fill(String(hourlyRate))

	// オファーを送信
	await page.getByRole('button', { name: 'オファーを送信' }).click()

	// 成功トーストが表示されるのを待機
	await expect(page.getByText('マッチングオファーを送信しました')).toBeVisible()
}

/**
 * 回答待ちのオファーがあることを確認
 * @param page - Playwrightのページオブジェクト
 * @param castId - キャストID
 */
export async function expectPendingOfferButton(
	page: Page,
	castId: string,
): Promise<void> {
	await page.goto(`/casts/${castId}/chat`)
	await page.waitForLoadState('networkidle')

	// 「回答待ちです」ボタンが表示されていることを確認
	await expect(page.getByRole('button', { name: '回答待ちです' })).toBeVisible()
}

/**
 * ホーム画面でマッチングカードの存在を確認
 * @param page - Playwrightのページオブジェクト
 * @param status - 期待するステータス（回答待ち、成立、不成立、ギャラ飲み中、完了）
 */
export async function expectMatchingCardWithStatus(
	page: Page,
	status: string,
): Promise<void> {
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	// マッチング状況セクションを見つける
	const matchingSection = page.locator('text=マッチング状況').locator('..')

	// ステータスバッジが表示されていることを確認
	await expect(matchingSection.getByText(status)).toBeVisible()
}

/**
 * キャストとしてオファーに回答（承認/拒否）
 * @param page - Playwrightのページオブジェクト
 * @param response - 'accepted' または 'rejected'
 */
export async function respondToOffer(
	page: Page,
	response: 'accepted' | 'rejected',
): Promise<void> {
	// ホームページに移動
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	// マッチング状況セクションのカードを探す
	const buttonName = response === 'accepted' ? '承認' : '拒否'
	const button = page.getByRole('button', { name: buttonName })

	await expect(button).toBeVisible()
	await button.click()

	// ボタンが消えるのを待機（処理完了の確認）
	await expect(button).not.toBeVisible({ timeout: 5000 })
}

/**
 * キャストとして合流ボタンをクリック
 * @param page - Playwrightのページオブジェクト
 */
export async function startMatching(page: Page): Promise<void> {
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	const startButton = page.getByRole('button', { name: '合流' })
	await expect(startButton).toBeVisible()
	await startButton.click()

	// ボタンが消えるのを待機
	await expect(startButton).not.toBeVisible({ timeout: 5000 })
}

/**
 * キャストとして終了ボタンをクリック
 * @param page - Playwrightのページオブジェクト
 */
export async function completeMatching(page: Page): Promise<void> {
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	const completeButton = page.getByRole('button', { name: '終了' })
	await expect(completeButton).toBeVisible()
	await completeButton.click()

	// ボタンが消えるのを待機
	await expect(completeButton).not.toBeVisible({ timeout: 5000 })
}

/**
 * ゲストとして延長を実行
 * @param page - Playwrightのページオブジェクト
 * @param extensionMinutes - 延長時間（分）
 */
export async function extendMatching(
	page: Page,
	extensionMinutes: number = 30,
): Promise<void> {
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	// 延長時間を選択
	const selectTrigger = page.locator('[data-slot="trigger"]').first()
	await selectTrigger.click()

	// 延長時間オプションを選択
	const extensionLabel =
		extensionMinutes === 30
			? '30分'
			: extensionMinutes === 60
				? '1時間'
				: extensionMinutes === 90
					? '1時間30分'
					: '2時間'

	await page.getByRole('option', { name: extensionLabel }).click()

	// 延長ボタンをクリック
	const extendButton = page.getByRole('button', { name: '延長する' })
	await expect(extendButton).toBeVisible()
	await extendButton.click()

	// 処理完了を待機（ボタンが無効化されないか確認）
	await page.waitForTimeout(1000)
}

/**
 * 完了済みマッチングセクションにマッチングがあることを確認
 * @param page - Playwrightのページオブジェクト
 */
export async function expectCompletedMatching(page: Page): Promise<void> {
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	// 完了済みマッチングセクションを確認
	const completedSection = page.locator('text=完了済みマッチング').locator('..')

	// 完了バッジが表示されているカードが存在することを確認
	await expect(completedSection.getByText('完了')).toBeVisible()
}
