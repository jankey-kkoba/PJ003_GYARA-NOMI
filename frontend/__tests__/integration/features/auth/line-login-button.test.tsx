/**
 * LineLoginButton 統合テスト
 *
 * LINEログインボタンのUI表示とログイン処理を検証
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { LineLoginButton } from '@/features/auth/components/atoms/LineLoginButton'
import { TestProviders } from '@tests/utils'

// useAuth のモック
const mockLineLogin = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    lineLogin: mockLineLogin,
  }),
}))

describe('LineLoginButton', () => {
  it('ボタンが表示される', async () => {
    render(
      <TestProviders>
        <LineLoginButton />
      </TestProviders>
    )

    await expect
      .element(page.getByRole('button', { name: /LINEでログイン/i }))
      .toBeVisible()
  })

  it('ボタンテキストが正しく表示される', async () => {
    render(
      <TestProviders>
        <LineLoginButton />
      </TestProviders>
    )

    // ボタンが表示されていることを確認
    const button = page.getByRole('button', { name: /LINEでログイン/i })
    await expect.element(button).toBeVisible()
  })

  it('クリックでlineLoginが呼び出される', async () => {
    render(
      <TestProviders>
        <LineLoginButton />
      </TestProviders>
    )

    await page.getByRole('button', { name: /LINEでログイン/i }).click()

    expect(mockLineLogin).toHaveBeenCalled()
  })

  it('クリックでlineLoginが引数なしで呼び出される', async () => {
    mockLineLogin.mockClear()

    render(
      <TestProviders>
        <LineLoginButton />
      </TestProviders>
    )

    await page.getByRole('button', { name: /LINEでログイン/i }).click()

    expect(mockLineLogin).toHaveBeenCalledWith()
  })
})
