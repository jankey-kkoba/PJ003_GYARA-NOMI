/**
 * LoginTemplate 統合テスト
 *
 * ログインページのUI表示とリンクを検証
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { LoginTemplate } from '@/features/auth/components/templates/LoginTemplate'
import { TestProviders } from '@tests/utils'

// useAuth のモック
vi.mock('@/features/auth/hooks/useAuth', () => ({
	useAuth: () => ({
		lineLogin: vi.fn(),
	}),
}))

describe('LoginTemplate', () => {
	describe('UI表示', () => {
		it('タイトルが表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			await expect
				.element(
					page.getByRole('heading', { name: 'ギャラ飲みプラットフォーム' }),
				)
				.toBeVisible()
		})

		it('説明文が表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			await expect
				.element(page.getByText('キャストとゲストをつなぐプラットフォーム'))
				.toBeVisible()
		})

		it('LINEログインボタンが表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			await expect
				.element(page.getByRole('button', { name: /LINEでログイン/i }))
				.toBeVisible()
		})

		it('利用規約リンクが表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			await expect.element(page.getByText('利用規約')).toBeVisible()
		})

		it('プライバシーポリシーリンクが表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			await expect.element(page.getByText('プライバシーポリシー')).toBeVisible()
		})
	})

	describe('サインアップリンク', () => {
		it('ゲスト登録リンクが表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			const link = page.getByRole('link', { name: 'ゲストとして登録' })
			await expect.element(link).toBeVisible()
			await expect.element(link).toHaveAttribute('href', '/sign-up?type=guest')
		})

		it('キャスト登録リンクが表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			const link = page.getByRole('link', { name: 'キャストとして登録' })
			await expect.element(link).toBeVisible()
			await expect.element(link).toHaveAttribute('href', '/sign-up?type=cast')
		})

		it('アカウント未所持の案内文が表示される', async () => {
			render(
				<TestProviders>
					<LoginTemplate />
				</TestProviders>,
			)

			await expect
				.element(page.getByText('アカウントをお持ちでない方は'))
				.toBeVisible()
		})
	})
})
