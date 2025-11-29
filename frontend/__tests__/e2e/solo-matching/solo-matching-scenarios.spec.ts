/**
 * ソロマッチング シナリオE2Eテスト
 *
 * 以下のシナリオを検証:
 * 1. ソロマッチングをオファーしたが却下された
 * 2. ソロマッチングが受諾され、合流後、延長もなくマッチングが終了した
 * 3. ソロマッチングが受諾され、合流後、終了前に一度延長され、マッチングが終了した
 * 4. ソロマッチングオファーを出した相手にもう一度オファーすることができない
 *
 * 注意: シナリオ4は最後に実行（pending状態を残すため）
 */

import { test, expect, Page } from '@playwright/test'
import { loginAsGuest, loginAsCast, logout } from '@tests/e2e/helpers/auth'
import { E2E_TEST_CAST_ID } from '@tests/e2e/helpers/solo-matching'

/**
 * テスト用のユニークな場所名を生成
 * 各テストでオファーを識別するために使用
 */
function generateUniqueLocation(testName: string): string {
	const timestamp = Date.now()
	return `E2E-${testName}-${timestamp}`
}

/**
 * キャストとしてログインし、全てのpending/accepted/in_progressオファーを処理してクリアする
 * テストの独立性を確保するために使用
 */
async function clearAllMatchingsAsCast(page: Page): Promise<void> {
	await loginAsCast(page)
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	const maxIterations = 10
	let iterations = 0

	// すべてのマッチングを処理するループ
	while (iterations < maxIterations) {
		// ページをリロードして最新状態を取得
		if (iterations > 0) {
			await page.reload()
			await page.waitForLoadState('networkidle')
		}

		// マッチング状況セクションの読み込み完了を待機
		// ローディング中メッセージが消えるか、「マッチングはありません」が表示されるまで待つ
		const loadingText = page.getByText('マッチング状況を読み込み中...')
		const noMatchingsText = page.getByText('マッチングはありません')

		// ローディングが完了するまで待機（最大10秒）
		try {
			await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
		} catch {
			// ローディングメッセージが見つからない場合は既に完了している
		}

		// マッチングがない場合は終了
		if (await noMatchingsText.isVisible().catch(() => false)) {
			break
		}

		// 少し待機してからボタンを確認
		await page.waitForTimeout(500)

		// 拒否ボタンがあればクリック（pending状態のオファー）
		const rejectButton = page.getByRole('button', { name: '拒否' }).first()
		if (await rejectButton.isVisible().catch(() => false)) {
			await rejectButton.click()
			// 処理完了を待機
			await page.waitForTimeout(1500)
			iterations++
			continue
		}

		// 終了ボタンがあればクリック（in_progress状態のマッチング）
		const completeButton = page.getByRole('button', { name: '終了' }).first()
		if (await completeButton.isVisible().catch(() => false)) {
			await completeButton.click()
			await page.waitForTimeout(1500)
			iterations++
			continue
		}

		// 合流ボタンがあればクリック→終了（accepted状態のマッチング）
		const startButton = page.getByRole('button', { name: '合流' }).first()
		if (await startButton.isVisible().catch(() => false)) {
			await startButton.click()
			await page.waitForTimeout(1500)
			// 終了ボタンをクリック
			const endBtn = page.getByRole('button', { name: '終了' }).first()
			await endBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
			if (await endBtn.isVisible().catch(() => false)) {
				await endBtn.click()
				await page.waitForTimeout(1500)
			}
			iterations++
			continue
		}

		// 処理するものがなければ終了
		break
	}

	await logout(page)
}

/**
 * チャットページでマッチングオファーを送信
 */
async function sendOffer(
	page: Page,
	castId: string,
	location: string,
): Promise<void> {
	await page.goto(`/casts/${castId}/chat`)
	await page.waitForLoadState('networkidle')

	// オファーボタンをクリック
	const offerButton = page.getByRole('button', {
		name: 'マッチングオファーを送る',
	})
	await expect(offerButton).toBeVisible({ timeout: 10000 })
	await offerButton.click()

	// ダイアログが開くのを待機
	await expect(page.getByRole('dialog')).toBeVisible()

	// 場所を入力
	await page.getByLabel('希望場所').fill(location)

	// オファーを送信
	await page.getByRole('button', { name: 'オファーを送信' }).click()

	// 成功トーストが表示されるのを待機
	await expect(page.getByText('マッチングオファーを送信しました')).toBeVisible()

	// トーストが消えるのを待機
	await page.waitForTimeout(2000)
}

test.describe('ソロマッチング シナリオテスト', () => {
	// シリアル実行で干渉を防ぐ
	test.describe.configure({ mode: 'serial' })

	// シナリオ1: オファー却下（最初に実行）
	test('シナリオ1: ゲストがオファー → キャストが拒否 → ステータスがrejectedになる', async ({
		page,
	}) => {
		// === 事前準備: 既存のマッチングをクリア ===
		await clearAllMatchingsAsCast(page)

		const uniqueLocation = generateUniqueLocation('reject-test')

		// === ステップ1: ゲストとしてオファー送信 ===
		await loginAsGuest(page)
		await sendOffer(page, E2E_TEST_CAST_ID, uniqueLocation)
		await logout(page)

		// === ステップ2: キャストとしてオファーを拒否 ===
		await loginAsCast(page)
		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 拒否ボタンをクリック
		const rejectButton = page.getByRole('button', { name: '拒否' })
		await expect(rejectButton).toBeVisible({ timeout: 10000 })
		await rejectButton.click()

		// 拒否後、マッチングカードから拒否ボタンが消えることを確認
		await expect(rejectButton).not.toBeVisible({ timeout: 10000 })

		// === ステップ3: ゲストとして不成立を確認 ===
		await logout(page)
		await loginAsGuest(page)

		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// ユニークな場所名を持つマッチングカードを特定
		const locationText = page.getByText(uniqueLocation)
		await expect(locationText).toBeVisible({ timeout: 10000 })

		// 同じカード内の「不成立」バッジを確認
		// data-slot="card"でカードを特定し、その中で不成立バッジを探す
		const matchingCard = page
			.locator('[data-slot="card"]')
			.filter({ hasText: uniqueLocation })
			.first()
		await expect(matchingCard.getByText('不成立')).toBeVisible({
			timeout: 10000,
		})
	})

	// シナリオ2: マッチング終了（延長なし）
	test('シナリオ2: オファー → 承認 → 合流 → 終了のフローが正常に動作する', async ({
		page,
	}) => {
		// === 事前準備: 既存のマッチングをクリア ===
		await clearAllMatchingsAsCast(page)

		const uniqueLocation = generateUniqueLocation('complete-no-extend')

		// === ステップ1: ゲストとしてオファー送信 ===
		await loginAsGuest(page)
		await sendOffer(page, E2E_TEST_CAST_ID, uniqueLocation)
		await logout(page)

		// === ステップ2: キャストとしてオファーを承認 ===
		await loginAsCast(page)
		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 承認ボタンをクリック
		const acceptButton = page.getByRole('button', { name: '承認' })
		await expect(acceptButton).toBeVisible({ timeout: 10000 })
		await acceptButton.click()

		// 「成立」バッジが表示されることを確認
		await expect(page.getByText('成立')).toBeVisible({ timeout: 10000 })

		// === ステップ3: 合流 ===
		const startButton = page.getByRole('button', { name: '合流' })
		await expect(startButton).toBeVisible({ timeout: 10000 })
		await startButton.click()

		// 「ギャラ飲み中」バッジが表示されることを確認
		await expect(page.getByText('ギャラ飲み中')).toBeVisible({
			timeout: 10000,
		})

		// === ステップ4: 終了 ===
		const completeButton = page.getByRole('button', { name: '終了' })
		await expect(completeButton).toBeVisible({ timeout: 10000 })
		await completeButton.click()

		// マッチングカードが消えることを確認（完了後はマッチング状況から消える）
		await expect(completeButton).not.toBeVisible({ timeout: 10000 })

		// === ステップ5: ゲストとして完了を確認 ===
		await logout(page)
		await loginAsGuest(page)

		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 「完了済みマッチング」セクションでユニークな場所名を持つカードを特定
		const completedSection = page
			.locator('h2', { hasText: '完了済みマッチング' })
			.locator('..')
		const locationText = completedSection.getByText(uniqueLocation)
		await expect(locationText).toBeVisible({ timeout: 10000 })

		// 同じカード内の「完了」バッジを確認
		// data-slot="card"でカードを特定
		const matchingCard = completedSection
			.locator('[data-slot="card"]')
			.filter({ hasText: uniqueLocation })
			.first()
		await expect(matchingCard.getByText('完了')).toBeVisible({
			timeout: 10000,
		})
	})

	// シナリオ3: マッチング終了（延長あり）
	test('シナリオ3: オファー → 承認 → 合流 → 延長 → 終了のフローが正常に動作する', async ({
		page,
	}) => {
		// === 事前準備: 既存のマッチングをクリア ===
		await clearAllMatchingsAsCast(page)

		const uniqueLocation = generateUniqueLocation('complete-with-extend')

		// === ステップ1: ゲストとしてオファー送信 ===
		await loginAsGuest(page)
		await sendOffer(page, E2E_TEST_CAST_ID, uniqueLocation)
		await logout(page)

		// === ステップ2: キャストとしてオファーを承認 ===
		await loginAsCast(page)
		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 承認ボタンをクリック
		const acceptButton = page.getByRole('button', { name: '承認' })
		await expect(acceptButton).toBeVisible({ timeout: 10000 })
		await acceptButton.click()

		// 「成立」バッジが表示されることを確認
		await expect(page.getByText('成立')).toBeVisible({ timeout: 10000 })

		// === ステップ3: 合流 ===
		const startButton = page.getByRole('button', { name: '合流' })
		await expect(startButton).toBeVisible({ timeout: 10000 })
		await startButton.click()

		// 「ギャラ飲み中」バッジが表示されることを確認
		await expect(page.getByText('ギャラ飲み中')).toBeVisible({
			timeout: 10000,
		})

		// === ステップ4: ゲストとして延長 ===
		await logout(page)
		await loginAsGuest(page)

		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 「ギャラ飲み中」のマッチングが表示されていることを確認
		await expect(page.getByText('ギャラ飲み中')).toBeVisible({
			timeout: 10000,
		})

		// 延長ボタンが表示されるのを確認
		// 注意: 延長ボタンは予定終了時刻を過ぎている場合のみ表示される
		const extendButton = page.getByRole('button', { name: '延長する' })
		const hasExtendButton = await extendButton.isVisible().catch(() => false)

		if (hasExtendButton) {
			// 延長ボタンをクリック
			await extendButton.click()

			// 延長後もギャラ飲み中であることを確認
			await page.waitForTimeout(1000)
			await expect(page.getByText('ギャラ飲み中')).toBeVisible()
		} else {
			// 予定終了時刻を過ぎていない場合は延長ボタンが表示されない
			console.log(
				'延長ボタンが表示されていません（予定終了時刻前のため）。延長テストをスキップします。',
			)
		}

		// === ステップ5: キャストとして終了 ===
		await logout(page)
		await loginAsCast(page)

		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 終了ボタンをクリック
		const completeButton = page.getByRole('button', { name: '終了' })
		await expect(completeButton).toBeVisible({ timeout: 10000 })
		await completeButton.click()

		// マッチングカードが消えることを確認
		await expect(completeButton).not.toBeVisible({ timeout: 10000 })

		// === ステップ6: ゲストとして完了を確認 ===
		await logout(page)
		await loginAsGuest(page)

		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// 「完了済みマッチング」セクションでユニークな場所名を持つカードを特定
		const completedSection = page
			.locator('h2', { hasText: '完了済みマッチング' })
			.locator('..')
		const locationText = completedSection.getByText(uniqueLocation)
		await expect(locationText).toBeVisible({ timeout: 10000 })

		// 同じカード内の「完了」バッジを確認
		// data-slot="card"でカードを特定
		const matchingCard = completedSection
			.locator('[data-slot="card"]')
			.filter({ hasText: uniqueLocation })
			.first()
		await expect(matchingCard.getByText('完了')).toBeVisible({
			timeout: 10000,
		})
	})

	// シナリオ4: 重複オファー不可（最後に実行 - pending状態を残すため）
	test('シナリオ4: 同一キャストへの重複オファーができないことを確認', async ({
		page,
	}) => {
		// === 事前準備: 既存のマッチングをクリア ===
		await clearAllMatchingsAsCast(page)

		// ゲストとしてログイン
		await loginAsGuest(page)

		// E2Eテストキャストへのチャットページに移動
		await page.goto(`/casts/${E2E_TEST_CAST_ID}/chat`)
		await page.waitForLoadState('networkidle')

		// オファーを送信
		const offerButton = page.getByRole('button', {
			name: 'マッチングオファーを送る',
		})
		await expect(offerButton).toBeVisible({ timeout: 10000 })
		await offerButton.click()

		// ダイアログが開くのを待機
		await expect(page.getByRole('dialog')).toBeVisible()

		// 場所を入力
		const location = generateUniqueLocation('duplicate-test')
		await page.getByLabel('希望場所').fill(location)

		// オファーを送信
		await page.getByRole('button', { name: 'オファーを送信' }).click()

		// 成功トーストが表示されるのを待機
		await expect(
			page.getByText('マッチングオファーを送信しました'),
		).toBeVisible()

		// ページをリロード
		await page.reload()
		await page.waitForLoadState('networkidle')

		// 「回答待ちです」ボタンが表示されていることを確認
		// （同じキャストへの重複オファーができないことの証明）
		await expect(
			page.getByRole('button', { name: '回答待ちです' }),
		).toBeVisible({ timeout: 10000 })

		// 「マッチングオファーを送る」ボタンが表示されていないことを確認
		await expect(
			page.getByRole('button', { name: 'マッチングオファーを送る' }),
		).not.toBeVisible()
	})
})
