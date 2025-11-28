/**
 * cn ユーティリティ関数のユニットテスト
 *
 * 純粋関数なので Unit テストで十分
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/utils/cn'

describe('cn', () => {
	it('単一のクラス名を返す', () => {
		expect(cn('text-red-500')).toBe('text-red-500')
	})

	it('複数のクラス名をマージする', () => {
		expect(cn('p-4', 'm-2')).toBe('p-4 m-2')
	})

	it('条件付きクラス名を処理する', () => {
		const isActive = true
		const isDisabled = false

		expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
			'base active',
		)
	})

	it('オブジェクト形式の条件を処理する', () => {
		expect(
			cn('base', {
				active: true,
				disabled: false,
				hidden: true,
			}),
		).toBe('base active hidden')
	})

	it('Tailwind の競合するクラスをマージする', () => {
		// p-4 と p-2 が競合 → p-2 が優先
		expect(cn('p-4', 'p-2')).toBe('p-2')
	})

	it('text-* の競合を正しく処理する', () => {
		// text-red-500 と text-blue-500 が競合 → text-blue-500 が優先
		expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
	})

	it('空の入力を処理する', () => {
		expect(cn()).toBe('')
		expect(cn('')).toBe('')
		expect(cn(null, undefined, false)).toBe('')
	})

	it('配列形式のクラスを処理する', () => {
		expect(cn(['p-4', 'm-2'], 'bg-white')).toBe('p-4 m-2 bg-white')
	})

	it('複雑な組み合わせを処理する', () => {
		type Variant = 'primary' | 'secondary'
		type Size = 'sm' | 'lg'

		const variant = 'primary' as Variant
		const size = 'lg' as Size

		expect(
			cn(
				'base-class',
				variant === 'primary' && 'text-white bg-blue-500',
				variant === 'secondary' && 'text-gray-900 bg-gray-200',
				size === 'sm' && 'text-sm p-1',
				size === 'lg' && 'text-lg p-4',
				{
					'opacity-50': false,
					'cursor-pointer': true,
				},
			),
		).toBe('base-class text-white bg-blue-500 text-lg p-4 cursor-pointer')
	})
})
