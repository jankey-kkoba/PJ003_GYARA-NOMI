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
import { loginAsGuest, loginAsCast } from '@tests/e2e/helpers/auth'

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
      await loginAsGuest(page)
    })

    test('キャスト一覧が表示される', async ({ page }) => {
      await page.goto('/casts')

      // キャスト一覧ページが表示されることを確認
      await expect(page).toHaveURL('/casts')

      // キャストカードが表示されることを確認
      // 少なくとも1つのキャストカードが表示される（aria-labelで識別）
      const castCards = page.getByRole('link', { name: /のプロフィール$/ }).first()
      await expect(castCards).toBeVisible()
    })

    test('キャストカードに必要な情報が表示される', async ({ page }) => {
      await page.goto('/casts')

      // 最初のキャストカードを取得
      const firstCard = page.getByRole('link', { name: /のプロフィール$/ }).first()

      // キャスト名と年齢が含まれていることを確認
      await expect(firstCard).toBeVisible()
      
      // カード内にテキストコンテンツが存在することを確認
      const cardText = await firstCard.textContent()
      expect(cardText).toBeTruthy()
      expect(cardText).toMatch(/歳/) // 年齢情報が含まれている
    })

    test('ページネーションが表示される', async ({ page }) => {
      await page.goto('/casts')

      // ページネーションが表示されることを確認
      const pagination = page.getByRole('navigation')
      await expect(pagination).toBeVisible()

      // 次へボタンが表示される
      await expect(page.getByRole('link', { name: /next/i })).toBeVisible()
    })

    test('ページネーションで次のページに移動できる', async ({ page }) => {
      await page.goto('/casts')

      // 1ページ目の最初のキャスト名を記録
      const firstPageFirstCast = await page
        .getByRole('link', { name: /のプロフィール$/ })
        .first()
        .textContent()

      // 次へボタンをクリック
      await page.getByRole('link', { name: /next/i }).click()

      // URLが変わることを確認（クエリパラメータでページ管理している場合）
      // または、コンテンツが変わることを確認
      await page.waitForLoadState('networkidle')

      // 2ページ目の最初のキャスト名を取得
      const secondPageFirstCast = await page
        .getByRole('link', { name: /のプロフィール$/ })
        .first()
        .textContent()

      // 異なるキャストが表示されることを確認
      expect(firstPageFirstCast).not.toBe(secondPageFirstCast)
    })

    test('特定のページ番号をクリックして移動できる', async ({ page }) => {
      await page.goto('/casts')

      // ページ番号2をクリック
      await page.getByRole('link', { name: '2', exact: true }).click()

      await page.waitForLoadState('networkidle')

      // 2ページ目のコンテンツが表示されることを確認
      // ページネーションで2が選択状態になっていることを確認
      const page2Link = page.getByRole('link', { name: '2', exact: true })
      await expect(page2Link).toHaveAttribute('aria-current', 'page')
    })

    test('キャストカードをクリックすると詳細ページに遷移する', async ({ page }) => {
      await page.goto('/casts')

      // 最初のキャストカードをクリック
      const firstCard = page.getByRole('link', { name: /のプロフィール$/ }).first()
      await firstCard.click()

      // キャスト詳細ページに遷移することを確認（URLパターンで検証）
      await expect(page).toHaveURL(/\/casts\/seed-user-cast-/)
    })

    test('ローディング中はローディングインジケーターが表示される', async ({
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
      await expect(page.getByRole('link', { name: /のプロフィール$/ }).first()).toBeVisible()
    })

    test('エラーが発生した場合はエラーメッセージが表示される', async ({
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
    test.beforeEach(async ({ page }) => {
      // キャストユーザーとしてログイン
      await loginAsCast(page)
    })

    test('キャスト一覧ページにアクセスするとホームページにリダイレクトされる', async ({
      page,
    }) => {
      await page.goto('/casts')

      // ホームページにリダイレクトされることを確認
      await expect(page).toHaveURL('/')
    })
  })
})