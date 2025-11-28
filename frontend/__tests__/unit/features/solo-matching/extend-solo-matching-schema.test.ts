import { describe, it, expect } from 'vitest'
import { extendSoloMatchingSchema } from '@/features/solo-matching/schemas/extendSoloMatching'

describe('extendSoloMatchingSchema', () => {
	describe('extensionMinutes', () => {
		describe('有効な値', () => {
			it('30分は有効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 30,
				})
				expect(result.success).toBe(true)
			})

			it('60分は有効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 60,
				})
				expect(result.success).toBe(true)
			})

			it('90分は有効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 90,
				})
				expect(result.success).toBe(true)
			})

			it('120分は有効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 120,
				})
				expect(result.success).toBe(true)
			})
		})

		describe('無効な値（30分単位でない）', () => {
			it('15分は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 15,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.error.issues[0].message).toBe(
						'延長時間は30分単位で指定してください',
					)
				}
			})

			it('25分は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 25,
				})
				expect(result.success).toBe(false)
			})

			it('45分は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 45,
				})
				expect(result.success).toBe(false)
			})

			it('75分は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 75,
				})
				expect(result.success).toBe(false)
			})
		})

		describe('無効な値（正の整数でない）', () => {
			it('0は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 0,
				})
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.error.issues[0].message).toBe(
						'延長時間は正の整数である必要があります',
					)
				}
			})

			it('負の値は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: -30,
				})
				expect(result.success).toBe(false)
			})

			it('小数は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: 30.5,
				})
				expect(result.success).toBe(false)
			})
		})

		describe('無効な値（型が不正）', () => {
			it('文字列は無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: '30',
				})
				expect(result.success).toBe(false)
			})

			it('nullは無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: null,
				})
				expect(result.success).toBe(false)
			})

			it('undefinedは無効', () => {
				const result = extendSoloMatchingSchema.safeParse({
					extensionMinutes: undefined,
				})
				expect(result.success).toBe(false)
			})
		})
	})
})
