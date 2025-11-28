/**
 * RegisterTemplate 統合テスト
 *
 * プロフィール登録フォームのUI表示と送信処理を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { RegisterTemplate } from '@/features/auth/components/templates/RegisterTemplate'
import { TestProviders } from '@tests/utils'

// useRegisterUser のモック
const mockMutate = vi.fn()
const mockUseRegisterUser = vi.fn()

vi.mock('@/features/user/hooks/useRegisterUser', () => ({
	useRegisterUser: () => mockUseRegisterUser(),
}))

// next/navigation のモック
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}))

// useToast のモック
const mockShowToast = vi.fn()
vi.mock('@/hooks/useToast', () => ({
	useToast: () => ({
		showToast: mockShowToast,
	}),
}))

describe('RegisterTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUseRegisterUser.mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		})
	})

	describe('ゲストモード', () => {
		it('ゲスト向けタイトルが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByRole('heading', { name: 'ゲストプロフィール登録' }))
				.toBeVisible()
		})

		it('ゲスト向け説明文が表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(
					page.getByText('ゲストとしてプロフィール情報を入力してください'),
				)
				.toBeVisible()
		})
	})

	describe('キャストモード', () => {
		it('キャスト向けタイトルが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="cast" />
				</TestProviders>,
			)

			await expect
				.element(
					page.getByRole('heading', { name: 'キャストプロフィール登録' }),
				)
				.toBeVisible()
		})

		it('キャスト向け説明文が表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="cast" />
				</TestProviders>,
			)

			await expect
				.element(
					page.getByText('キャストとしてプロフィール情報を入力してください'),
				)
				.toBeVisible()
		})
	})

	describe('フォーム表示', () => {
		it('名前入力フィールドが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			const nameInput = page.getByLabelText('お名前')
			await expect.element(nameInput).toBeVisible()
		})

		it('生年月日入力フィールドが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			const birthDateInput = page.getByLabelText('生年月日')
			await expect.element(birthDateInput).toBeVisible()
			await expect.element(birthDateInput).toHaveAttribute('type', 'date')
		})

		it('登録ボタンが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByRole('button', { name: '登録する' }))
				.toBeVisible()
		})

		it('補足説明が表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByText('入力した情報は後から変更できます'))
				.toBeVisible()
		})
	})

	describe('送信処理', () => {
		it('フォーム送信でmutateが呼び出される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			// フォームに入力
			await page.getByLabelText('お名前').fill('テストユーザー')
			await page.getByLabelText('生年月日').fill('1990-01-01')

			// 送信
			await page.getByRole('button', { name: '登録する' }).click()

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

		it('キャストモードで正しいuserTypeが送信される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="cast" />
				</TestProviders>,
			)

			// フォームに入力
			await page.getByLabelText('お名前').fill('テストキャスト')
			await page.getByLabelText('生年月日').fill('1995-05-15')

			// 送信
			await page.getByRole('button', { name: '登録する' }).click()

			expect(mockMutate).toHaveBeenCalledWith(
				expect.objectContaining({
					userType: 'cast',
				}),
				expect.any(Object),
			)
		})
	})

	describe('バリデーションエラー表示', () => {
		it('名前が空のまま送信するとエラーメッセージが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			// 生年月日のみ入力して送信
			await page.getByLabelText('生年月日').fill('1990-01-01')
			await page.getByRole('button', { name: '登録する' }).click()

			// エラーメッセージが赤文字で表示される
			await expect.element(page.getByText('名前は必須です')).toBeVisible()

			// mutateは呼ばれない
			expect(mockMutate).not.toHaveBeenCalled()
		})

		it('生年月日が空のまま送信するとエラーメッセージが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			// 名前のみ入力して送信
			await page.getByLabelText('お名前').fill('テストユーザー')
			await page.getByRole('button', { name: '登録する' }).click()

			// エラーメッセージが赤文字で表示される
			await expect.element(page.getByText('生年月日は必須です')).toBeVisible()

			// mutateは呼ばれない
			expect(mockMutate).not.toHaveBeenCalled()
		})

		it('両方空の場合は両方のエラーメッセージが表示される', async () => {
			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			// 何も入力せず送信
			await page.getByRole('button', { name: '登録する' }).click()

			// 両方のエラーメッセージが表示される
			await expect.element(page.getByText('名前は必須です')).toBeVisible()
			await expect.element(page.getByText('生年月日は必須です')).toBeVisible()

			// mutateは呼ばれない
			expect(mockMutate).not.toHaveBeenCalled()
		})
	})

	describe('ローディング状態', () => {
		it('送信中は「登録中...」と表示される', async () => {
			mockUseRegisterUser.mockReturnValue({
				mutate: mockMutate,
				isPending: true,
			})

			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			await expect
				.element(page.getByRole('button', { name: '登録中...' }))
				.toBeVisible()
		})

		it('送信中はボタンが無効化される', async () => {
			mockUseRegisterUser.mockReturnValue({
				mutate: mockMutate,
				isPending: true,
			})

			render(
				<TestProviders>
					<RegisterTemplate userType="guest" />
				</TestProviders>,
			)

			const button = page.getByRole('button', { name: '登録中...' })
			await expect.element(button).toBeDisabled()
		})
	})
})
