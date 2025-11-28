/**
 * SignUpTemplate 統合テスト
 *
 * サインアップページのUI表示とLINEログイン呼び出しを検証
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { SignUpTemplate } from '@/features/auth/components/templates/SignUpTemplate'
import { TestProviders } from '@tests/utils'

// useAuth のモック
const mockLineLogin = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({
	useAuth: () => ({
		lineLogin: mockLineLogin,
	}),
}))

describe('SignUpTemplate', () => {
	describe('ゲストモード', () => {
		it('ゲスト向けタイトルが表示される', async () => {
			render(
				<TestProviders>
					<SignUpTemplate userType="guest" />
				</TestProviders>,
			)

			await expect.element(page.getByText('ゲストとして始める')).toBeVisible()
		})

		it('説明文が表示される', async () => {
			render(
				<TestProviders>
					<SignUpTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByText('LINEアカウントで簡単に登録できます'))
				.toBeVisible()
		})

		it('LINEで始めるボタンが表示される', async () => {
			render(
				<TestProviders>
					<SignUpTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByRole('button', { name: /LINEで始める/i }))
				.toBeVisible()
		})

		it('ボタンクリックでlineLoginがguestタイプで呼び出される', async () => {
			render(
				<TestProviders>
					<SignUpTemplate userType="guest" />
				</TestProviders>,
			)

			await page.getByRole('button', { name: /LINEで始める/i }).click()

			expect(mockLineLogin).toHaveBeenCalledWith('guest')
		})
	})

	describe('キャストモード', () => {
		it('キャスト向けタイトルが表示される', async () => {
			render(
				<TestProviders>
					<SignUpTemplate userType="cast" />
				</TestProviders>,
			)

			await expect.element(page.getByText('キャストとして始める')).toBeVisible()
		})

		it('ボタンクリックでlineLoginがcastタイプで呼び出される', async () => {
			render(
				<TestProviders>
					<SignUpTemplate userType="cast" />
				</TestProviders>,
			)

			await page.getByRole('button', { name: /LINEで始める/i }).click()

			expect(mockLineLogin).toHaveBeenCalledWith('cast')
		})
	})
})
