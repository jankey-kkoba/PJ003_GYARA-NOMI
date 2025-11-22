/**
 * CastFilterDialog コンポーネント統合テスト
 *
 * 年齢フィルターダイアログの操作、入力、適用、リセットを検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { CastFilterDialog, type CastFilterValues } from '@/features/cast/components/molecules/CastFilterDialog'

describe('CastFilterDialog', () => {
  let onApply: (values: CastFilterValues) => void

  beforeEach(() => {
    onApply = vi.fn()
  })

  describe('初期表示', () => {
    it('絞り込みボタンが表示される', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      await expect
        .element(page.getByRole('button', { name: /絞り込み/ }))
        .toBeInTheDocument()
    })

    it('フィルターがない場合はバッジが表示されない', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      const button = page.getByRole('button', { name: /絞り込み/ })
      await expect.element(button).toBeInTheDocument()

      // バッジ（数字1）が表示されないことを確認
      await expect.element(page.getByText('1')).not.toBeInTheDocument()
    })

    it('フィルターがある場合はバッジが表示される', async () => {
      render(<CastFilterDialog values={{ minAge: 20 }} onApply={onApply} />)

      // バッジ（数字1）が表示されることを確認
      await expect.element(page.getByText('1')).toBeInTheDocument()
    })
  })

  describe('ダイアログ操作', () => {
    it('ボタンクリックでダイアログが開く', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      await page.getByRole('button', { name: /絞り込み/ }).click()

      // ダイアログが開く
      await expect
        .element(page.getByRole('dialog'))
        .toBeInTheDocument()
      await expect
        .element(page.getByRole('heading', { name: '絞り込み' }))
        .toBeInTheDocument()
    })

    it('ダイアログに年齢入力欄が表示される', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      await page.getByRole('button', { name: /絞り込み/ }).click()

      await expect.element(page.getByText('年齢')).toBeInTheDocument()
      await expect.element(page.getByPlaceholder('18')).toBeInTheDocument()
      await expect.element(page.getByPlaceholder('99')).toBeInTheDocument()
    })

    it('初期値がある場合は入力欄に反映される', async () => {
      render(
        <CastFilterDialog values={{ minAge: 20, maxAge: 30 }} onApply={onApply} />
      )

      await page.getByRole('button', { name: /絞り込み/ }).click()

      const minAgeInput = page.getByPlaceholder('18')
      const maxAgeInput = page.getByPlaceholder('99')

      await expect.element(minAgeInput).toHaveValue(20)
      await expect.element(maxAgeInput).toHaveValue(30)
    })
  })

  describe('フィルター適用', () => {
    it('年齢を入力して適用ボタンを押すとonApplyが呼ばれる', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      // ダイアログを開く
      await page.getByRole('button', { name: /絞り込み/ }).click()

      // 年齢を入力
      const minAgeInput = page.getByPlaceholder('18')
      const maxAgeInput = page.getByPlaceholder('99')

      await userEvent.clear(minAgeInput)
      await userEvent.type(minAgeInput, '20')
      await userEvent.clear(maxAgeInput)
      await userEvent.type(maxAgeInput, '30')

      // 適用ボタンをクリック
      await page.getByRole('button', { name: '適用' }).click()

      // onApplyが正しい値で呼ばれる
      expect(onApply).toHaveBeenCalledWith({
        minAge: 20,
        maxAge: 30,
      })
    })

    it('minAgeのみ入力して適用できる', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      await page.getByRole('button', { name: /絞り込み/ }).click()

      const minAgeInput = page.getByPlaceholder('18')
      await userEvent.clear(minAgeInput)
      await userEvent.type(minAgeInput, '25')

      await page.getByRole('button', { name: '適用' }).click()

      expect(onApply).toHaveBeenCalledWith({
        minAge: 25,
        maxAge: undefined,
      })
    })

    it('maxAgeのみ入力して適用できる', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      await page.getByRole('button', { name: /絞り込み/ }).click()

      const maxAgeInput = page.getByPlaceholder('99')
      await userEvent.clear(maxAgeInput)
      await userEvent.type(maxAgeInput, '35')

      await page.getByRole('button', { name: '適用' }).click()

      expect(onApply).toHaveBeenCalledWith({
        minAge: undefined,
        maxAge: 35,
      })
    })

    it('適用後にダイアログが閉じる', async () => {
      render(<CastFilterDialog values={{}} onApply={onApply} />)

      await page.getByRole('button', { name: /絞り込み/ }).click()
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()

      await page.getByRole('button', { name: '適用' }).click()

      // ダイアログが閉じる
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('フィルターリセット', () => {
    it('リセットボタンを押すと空のフィルターでonApplyが呼ばれる', async () => {
      render(
        <CastFilterDialog values={{ minAge: 20, maxAge: 30 }} onApply={onApply} />
      )

      await page.getByRole('button', { name: /絞り込み/ }).click()

      // リセットボタンをクリック
      await page.getByRole('button', { name: /リセット/ }).click()

      expect(onApply).toHaveBeenCalledWith({})
    })

    it('リセット後にダイアログが閉じる', async () => {
      render(
        <CastFilterDialog values={{ minAge: 20 }} onApply={onApply} />
      )

      await page.getByRole('button', { name: /絞り込み/ }).click()
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()

      await page.getByRole('button', { name: /リセット/ }).click()

      // ダイアログが閉じる
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    })

  })

  describe('バリデーション', () => {
    it('空の入力で適用するとundefinedになる', async () => {
      render(
        <CastFilterDialog values={{ minAge: 20 }} onApply={onApply} />
      )

      await page.getByRole('button', { name: /絞り込み/ }).click()

      // 入力をクリア
      const minAgeInput = page.getByPlaceholder('18')
      await userEvent.clear(minAgeInput)

      await page.getByRole('button', { name: '適用' }).click()

      expect(onApply).toHaveBeenCalledWith({
        minAge: undefined,
        maxAge: undefined,
      })
    })
  })
})
