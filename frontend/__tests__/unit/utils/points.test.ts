import { describe, it, expect } from 'vitest'
import { calculatePoints } from '@/utils/points'

describe('calculatePoints', () => {
	it('1時間で時給3000円の場合、3000ポイントを返す', () => {
		expect(calculatePoints(60, 3000)).toBe(3000)
	})

	it('2時間で時給3000円の場合、6000ポイントを返す', () => {
		expect(calculatePoints(120, 3000)).toBe(6000)
	})

	it('30分で時給3000円の場合、1500ポイントを返す', () => {
		expect(calculatePoints(30, 3000)).toBe(1500)
	})

	it('3時間30分で時給5000円の場合、17500ポイントを返す', () => {
		expect(calculatePoints(210, 5000)).toBe(17500)
	})

	it('45分で時給4000円の場合、3000ポイントを返す', () => {
		expect(calculatePoints(45, 4000)).toBe(3000)
	})

	it('0分の場合、0ポイントを返す', () => {
		expect(calculatePoints(0, 3000)).toBe(0)
	})

	it('時給0円の場合、0ポイントを返す', () => {
		expect(calculatePoints(60, 0)).toBe(0)
	})

	it('小数点以下は四捨五入される', () => {
		// 20分 × 3000円/時 = 1000ポイント
		expect(calculatePoints(20, 3000)).toBe(1000)
		// 25分 × 3000円/時 = 1250ポイント
		expect(calculatePoints(25, 3000)).toBe(1250)
	})
})
