/**
 * キャスト一覧 E2Eテスト
 *
 * ゲストユーザーのキャスト一覧閲覧フローを検証
 * - キャスト一覧の表示
 * - ページネーション操作
 * - キャストカードの表示内容
 * - 認証状態による表示制御
 */

import { test, expect } from '@playwright/test'

test.describe('Cast List', () => {
  test.describe('認証なしの場合', () => {
    test('キャスト一覧ページにアクセスするとログインページにリダイレクトされる', async ({
      page,
    }) => {
      await page.goto('/casts')

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('ゲストユーザーとしてログイン済みの場合', () => {
    test.beforeEach(async ({ page }) => {
      // ゲストユーザーとしてログイン
      // 注: 実際の実装では、Auth.jsのモックセッションを設定する必要があります
      // ここでは、将来的にログイン機能が実装された際のプレースホルダーとして記述
      await page.goto('/login')

      // TODO: 実際のログイン処理を実装
      // 現時点では、認証機能が未実装のため、このテストはスキップまたは
      // モックセッションを使用して実装する必要があります
    })

    test.skip('キャスト一覧が表示される', async ({ page }) => {
      await page.goto('/casts')

      // キャスト一覧ページが表示されることを確認
      await expect(page).toHaveURL('/casts')

      // キャストカードが表示されることを確認
      // 少なくとも1つのキャストカードが表示される
      const castCards = page.locator('[data-testid="cast-card"]').first()
      await expect(castCards).toBeVisible()
    })

    test.skip('キャストカードに必要な情報が表示される', async ({ page }) => {
      await page.goto('/casts')

      // 最初のキャストカードを取得
      const firstCard = page.locator('[data-testid="cast-card"]').first()

      // キャスト名が表示される
      await expect(firstCard.locator('[data-testid="cast-name"]')).toBeVisible()

      // 年齢が表示される
      await expect(firstCard.locator('[data-testid="cast-age"]')).toBeVisible()

      // エリア名が表示される
      await expect(firstCard.locator('[data-testid="cast-area"]')).toBeVisible()
    })

    test.skip('ページネーションが表示される', async ({ page }) => {
      await page.goto('/casts')

      // ページネーションが表示されることを確認
      const pagination = page.getByRole('navigation')
      await expect(pagination).toBeVisible()

      // 次へボタンが表示される
      await expect(page.getByRole('link', { name: /next/i })).toBeVisible()
    })

    test.skip('ページネーションで次のページに移動できる', async ({ page }) => {
      await page.goto('/casts')

      // 1ページ目の最初のキャスト名を記録
      const firstPageFirstCast = await page
        .locator('[data-testid="cast-card"]')
        .first()
        .locator('[data-testid="cast-name"]')
        .textContent()

      // 次へボタンをクリック
      await page.getByRole('link', { name: /next/i }).click()

      // URLが変わることを確認（クエリパラメータでページ管理している場合）
      // または、コンテンツが変わることを確認
      await page.waitForLoadState('networkidle')

      // 2ページ目の最初のキャスト名を取得
      const secondPageFirstCast = await page
        .locator('[data-testid="cast-card"]')
        .first()
        .locator('[data-testid="cast-name"]')
        .textContent()

      // 異なるキャストが表示されることを確認
      expect(firstPageFirstCast).not.toBe(secondPageFirstCast)
    })

    test.skip('特定のページ番号をクリックして移動できる', async ({ page }) => {
      await page.goto('/casts')

      // ページ番号2をクリック
      await page.getByRole('link', { name: '2', exact: true }).click()

      await page.waitForLoadState('networkidle')

      // 2ページ目のコンテンツが表示されることを確認
      // ページネーションで2が選択状態になっていることを確認
      const page2Link = page.getByRole('link', { name: '2', exact: true })
      await expect(page2Link).toHaveAttribute('aria-current', 'page')
    })

    test.skip('キャストカードをクリックすると詳細ページに遷移する', async ({ page }) => {
      await page.goto('/casts')

      // 最初のキャストカードをクリック
      const firstCard = page.locator('[data-testid="cast-card"]').first()
      const castId = await firstCard.getAttribute('data-cast-id')

      await firstCard.click()

      // キャスト詳細ページに遷移することを確認
      await expect(page).toHaveURL(`/casts/${castId}`)
    })

    test.skip('キャストが0件の場合は空のメッセージが表示される', async ({ page }) => {
      // キャストが0件の状態を作成する必要がある
      // テストデータのセットアップが必要

      await page.goto('/casts')

      // 空のメッセージが表示されることを確認
      await expect(page.getByText('キャストが見つかりませんでした')).toBeVisible()
    })

    test.skip('ローディング中はローディングインジケーターが表示される', async ({
      page,
    }) => {
      // ネットワークを遅延させてローディング状態を確認
      await page.route('**/api/casts*', async (route) => {
        await page.waitForTimeout(1000) // 1秒遅延
        await route.continue()
      })

      await page.goto('/casts')

      // ローディングインジケーターが表示されることを確認
      await expect(page.getByText('読み込み中...')).toBeVisible()

      // ローディングが終わったらキャストが表示される
      await expect(page.locator('[data-testid="cast-card"]').first()).toBeVisible()
    })

    test.skip('エラーが発生した場合はエラーメッセージが表示される', async ({
      page,
    }) => {
      // APIエラーをシミュレート
      await page.route('**/api/casts*', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: 'サーバーエラー' }),
        })
      })

      await page.goto('/casts')

      // エラーメッセージが表示されることを確認
      await expect(page.getByText(/エラーが発生しました/)).toBeVisible()
    })
  })

  test.describe('キャストユーザーの場合', () => {
    test.skip('キャスト一覧ページにアクセスすると403エラーページが表示される', async ({
      page,
    }) => {
      // キャストユーザーとしてログイン
      // TODO: キャストユーザーのセッションを設定

      await page.goto('/casts')

      // 403エラーまたはアクセス拒否メッセージが表示される
      await expect(
        page.getByText(/この機能はゲストユーザーのみ利用できます/)
      ).toBeVisible()
    })
  })
})
