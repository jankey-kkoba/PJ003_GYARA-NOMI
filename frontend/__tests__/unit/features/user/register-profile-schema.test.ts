/**
 * registerProfileSchema Unit テスト
 *
 * プロフィール登録のZodスキーマを検証
 */

import { describe, it, expect } from 'vitest'
import {
	registerProfileSchema,
	type RegisterProfileInput,
} from '@/features/user/schemas/registerProfile'

describe('registerProfileSchema', () => {
	describe('正常系', () => {
		it('有効なデータを解析できる', () => {
			const validData = {
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 'guest',
			}

			const result = registerProfileSchema.safeParse(validData)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(validData)
			}
		})

		it('guestタイプのユーザーを許可する', () => {
			const result = registerProfileSchema.safeParse({
				name: 'ゲストユーザー',
				birthDate: '1995-05-15',
				userType: 'guest',
			})

			expect(result.success).toBe(true)
		})

		it('castタイプのユーザーを許可する', () => {
			const result = registerProfileSchema.safeParse({
				name: 'キャストユーザー',
				birthDate: '1998-12-25',
				userType: 'cast',
			})

			expect(result.success).toBe(true)
		})

		it('1文字の名前を許可する', () => {
			const result = registerProfileSchema.safeParse({
				name: 'A',
				birthDate: '2000-01-01',
				userType: 'guest',
			})

			expect(result.success).toBe(true)
		})

		it('日本語の名前を許可する', () => {
			const result = registerProfileSchema.safeParse({
				name: '山田太郎',
				birthDate: '1985-03-20',
				userType: 'cast',
			})

			expect(result.success).toBe(true)
		})

		it('スペースを含む名前を許可する', () => {
			const result = registerProfileSchema.safeParse({
				name: 'John Smith',
				birthDate: '1992-07-10',
				userType: 'guest',
			})

			expect(result.success).toBe(true)
		})
	})

	describe('name フィールド', () => {
		it('空文字列の場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: '',
				birthDate: '1990-01-01',
				userType: 'guest',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('名前は必須です')
			}
		})

		it('nameが欠落している場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				birthDate: '1990-01-01',
				userType: 'guest',
			})

			expect(result.success).toBe(false)
		})

		it('nameがnullの場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: null,
				birthDate: '1990-01-01',
				userType: 'guest',
			})

			expect(result.success).toBe(false)
		})

		it('nameが数値の場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 123,
				birthDate: '1990-01-01',
				userType: 'guest',
			})

			expect(result.success).toBe(false)
		})
	})

	describe('birthDate フィールド', () => {
		it('空文字列の場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '',
				userType: 'guest',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('生年月日は必須です')
			}
		})

		it('birthDateが欠落している場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				userType: 'guest',
			})

			expect(result.success).toBe(false)
		})

		it('YYYY-MM-DD形式を受け入れる', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 'guest',
			})

			expect(result.success).toBe(true)
		})

		it('任意の文字列形式を受け入れる（バリデーションは文字列の存在のみ）', () => {
			// 現在のスキーマは日付形式のバリデーションをしていない
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '2000/01/01',
				userType: 'guest',
			})

			expect(result.success).toBe(true)
		})
	})

	describe('userType フィールド', () => {
		it('userTypeが欠落している場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '1990-01-01',
			})

			expect(result.success).toBe(false)
		})

		it('不正なuserType（admin）の場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 'admin',
			})

			expect(result.success).toBe(false)
		})

		it('不正なuserType（unknown）の場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 'unknown',
			})

			expect(result.success).toBe(false)
		})

		it('userTypeが数値の場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 1,
			})

			expect(result.success).toBe(false)
		})
	})

	describe('複合検証', () => {
		it('複数のフィールドがエラーの場合、すべてのエラーを返す', () => {
			const result = registerProfileSchema.safeParse({
				name: '',
				birthDate: '',
				userType: 'invalid',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
			}
		})

		it('空のオブジェクトの場合エラーを返す', () => {
			const result = registerProfileSchema.safeParse({})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
			}
		})

		it('追加のフィールドは無視される', () => {
			const result = registerProfileSchema.safeParse({
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 'guest',
				extraField: 'ignored',
			})

			expect(result.success).toBe(true)
		})
	})

	describe('型推論', () => {
		it('RegisterProfileInput型が正しく推論される', () => {
			const input: RegisterProfileInput = {
				name: 'テストユーザー',
				birthDate: '1990-01-01',
				userType: 'guest',
			}

			const result = registerProfileSchema.parse(input)

			expect(result.name).toBe('テストユーザー')
			expect(result.birthDate).toBe('1990-01-01')
			expect(result.userType).toBe('guest')
		})
	})
})
