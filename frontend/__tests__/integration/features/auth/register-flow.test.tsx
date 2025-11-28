/**
 * RegisterTemplate 統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * ユーザー視点でフォームの動作を検証する
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { RegisterTemplate } from '@/features/auth/components/templates/RegisterTemplate'
import { TestProviders } from '@tests/utils'

// next/navigation のモック
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
	}),
}))

// useRegisterUser のモック
const mockMutate = vi.fn()
vi.mock('@/features/user/hooks/useRegisterUser', () => ({
	useRegisterUser: () => ({
		mutate: mockMutate,
		isPending: false,
	}),
}))

// useToast のモック
const mockShowToast = vi.fn()
vi.mock('@/hooks/useToast', () => ({
	useToast: () => ({
		showToast: mockShowToast,
		hideAllToasts: vi.fn(),
	}),
}))

describe('RegisterTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('ゲスト登録フォーム', () => {
		it('ゲスト用のタイトルと説明が表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByText('ゲストプロフィール登録'))
				.toBeVisible()
			await expect
				.element(
					page.getByText('ゲストとしてプロフィール情報を入力してください'),
				)
				.toBeVisible()
		})

		it('必須フィールドが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			// フォームフィールドの存在確認
			await expect.element(page.getByLabelText('お名前')).toBeVisible()
			await expect.element(page.getByLabelText('生年月日')).toBeVisible()
			await expect
				.element(page.getByRole('button', { name: '登録する' }))
				.toBeVisible()
		})

		it('フォームに入力して送信できる', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			// フォームに入力
			await page.getByLabelText('お名前').fill('テストユーザー')
			await page.getByLabelText('生年月日').fill('1990-01-01')

			// 送信ボタンをクリック
			await page.getByRole('button', { name: '登録する' }).click()

			// mutate が呼ばれたことを確認
			expect(mockMutate).toHaveBeenCalledWith(
				{
					name: 'テストユーザー',
					birthDate: '1990-01-01',
					userType: 'guest',
				},
				expect.objectContaining({
					onSuccess: expect.any(Function),
				}),
			)
		})
	})

	describe('キャスト登録フォーム', () => {
		it('キャスト用のタイトルと説明が表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="cast" />
				</TestProviders>,
			)

			await expect
				.element(page.getByText('キャストプロフィール登録'))
				.toBeVisible()
			await expect
				.element(
					page.getByText('キャストとしてプロフィール情報を入力してください'),
				)
				.toBeVisible()
		})

		it('フォーム送信時に正しい userType が渡される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="cast" />
				</TestProviders>,
			)

			await page.getByLabelText('お名前').fill('キャストユーザー')
			await page.getByLabelText('生年月日').fill('1995-05-05')
			await page.getByRole('button', { name: '登録する' }).click()

			expect(mockMutate).toHaveBeenCalledWith(
				expect.objectContaining({
					userType: 'cast',
				}),
				expect.any(Object),
			)
		})
	})

	describe('コールバック処理', () => {
		it('成功時に成功トーストが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await page.getByLabelText('お名前').fill('成功ユーザー')
			await page.getByLabelText('生年月日').fill('1990-01-01')
			await page.getByRole('button', { name: '登録する' }).click()

			// onSuccess コールバックを取得して実行
			const onSuccess = mockMutate.mock.calls[0][1].onSuccess
			onSuccess()

			expect(mockShowToast).toHaveBeenCalledWith(
				'プロフィール登録が完了しました。',
				'success',
			)
		})
	})
})
