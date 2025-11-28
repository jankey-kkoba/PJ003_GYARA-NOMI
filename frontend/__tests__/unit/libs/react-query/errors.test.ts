import { describe, it, expect } from 'vitest'
import { ApiError } from '@/libs/react-query/errors'

describe('ApiError', () => {
	describe('コンストラクタ', () => {
		it('基本的なエラー情報を保持できる', () => {
			const error = new ApiError('エラーメッセージ', 400, 'validation')

			expect(error.message).toBe('エラーメッセージ')
			expect(error.statusCode).toBe(400)
			expect(error.type).toBe('validation')
			expect(error.name).toBe('ApiError')
		})

		it('ステータスコードなしでエラーを作成できる', () => {
			const error = new ApiError('ネットワークエラー', undefined, 'network')

			expect(error.message).toBe('ネットワークエラー')
			expect(error.statusCode).toBeUndefined()
			expect(error.type).toBe('network')
		})

		it('元のエラーデータを保持できる', () => {
			const originalError = { error: 'original error data' }
			const error = new ApiError('エラー', 500, 'server', originalError)

			expect(error.originalError).toEqual(originalError)
		})
	})

	describe('inferTypeFromStatus', () => {
		it('400エラーをvalidationと判定する', () => {
			expect(ApiError.inferTypeFromStatus(400)).toBe('validation')
		})

		it('401エラーをauthenticationと判定する', () => {
			expect(ApiError.inferTypeFromStatus(401)).toBe('authentication')
		})

		it('403エラーをauthorizationと判定する', () => {
			expect(ApiError.inferTypeFromStatus(403)).toBe('authorization')
		})

		it('404エラーをnot_foundと判定する', () => {
			expect(ApiError.inferTypeFromStatus(404)).toBe('not_found')
		})

		it('500番台エラーをserverと判定する', () => {
			expect(ApiError.inferTypeFromStatus(500)).toBe('server')
			expect(ApiError.inferTypeFromStatus(503)).toBe('server')
		})

		it('その他のステータスコードをunknownと判定する', () => {
			expect(ApiError.inferTypeFromStatus(418)).toBe('unknown')
		})
	})

	describe('shouldShowToUser', () => {
		it('認証エラー以外はユーザーに表示すべきと判定する', () => {
			const validationError = new ApiError('検証エラー', 400, 'validation')
			const serverError = new ApiError('サーバーエラー', 500, 'server')

			expect(validationError.shouldShowToUser()).toBe(true)
			expect(serverError.shouldShowToUser()).toBe(true)
		})

		it('認証エラーはユーザーに表示すべきでないと判定する', () => {
			const authError = new ApiError('認証エラー', 401, 'authentication')

			expect(authError.shouldShowToUser()).toBe(false)
		})
	})

	describe('instanceof チェック', () => {
		it('ApiErrorのインスタンスとして認識される', () => {
			const error = new ApiError('テストエラー')

			expect(error instanceof ApiError).toBe(true)
			expect(error instanceof Error).toBe(true)
		})
	})
})
