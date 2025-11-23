import { describe, it, expect } from 'vitest'
import {
  handleApiError,
  handleApiResponse,
  handleNetworkError,
} from '@/libs/react-query/error-handler'
import { ApiError } from '@/libs/react-query/errors'

describe('error-handler', () => {
  describe('handleApiError', () => {
    it('レスポンスが成功の場合はエラーをthrowしない', async () => {
      const response = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      await expect(handleApiError(response)).resolves.toBeUndefined()
    })

    it('レスポンスが失敗の場合はApiErrorをthrowする', async () => {
      const response = new Response(
        JSON.stringify({ error: 'バリデーションエラー' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )

      try {
        await handleApiError(response)
        expect.fail('エラーがthrowされるべきです')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
          message: 'バリデーションエラー',
        })
      }
    })

    it('エラーレスポンスにmessageフィールドがある場合もエラーメッセージとして使用する', async () => {
      const response = new Response(
        JSON.stringify({ message: 'サーバーエラー' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )

      await expect(handleApiError(response)).rejects.toThrow('サーバーエラー')
    })

    it('デフォルトメッセージを指定できる', async () => {
      const response = new Response(JSON.stringify({}), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

      await expect(
        handleApiError(response, 'カスタムエラーメッセージ')
      ).rejects.toThrow('カスタムエラーメッセージ')
    })

    it('JSONのパースに失敗した場合もApiErrorをthrowする', async () => {
      const response = new Response('Invalid JSON', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      })

      await expect(
        handleApiError(response, 'パースエラー')
      ).rejects.toThrow(ApiError)
    })

    it('throwされたApiErrorに正しいステータスコードとタイプが含まれる', async () => {
      const response = new Response(JSON.stringify({ error: '認証エラー' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

      try {
        await handleApiError(response)
        // ここには到達しないはず
        expect.fail('エラーがthrowされるべきです')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401)
          expect(error.type).toBe('authentication')
        }
      }
    })
  })

  describe('handleApiResponse', () => {
    it('成功レスポンスのJSONデータを返す', async () => {
      const responseData = { success: true, data: { id: '123' } }
      const response = new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await handleApiResponse(response)
      expect(result).toEqual(responseData)
    })

    it('失敗レスポンスの場合はApiErrorをthrowする', async () => {
      const response = new Response(JSON.stringify({ error: 'エラー' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })

      await expect(handleApiResponse(response)).rejects.toThrow(ApiError)
    })
  })

  describe('handleNetworkError', () => {
    it('通常のErrorからApiErrorを生成する', () => {
      const error = new Error('ネットワーク接続エラー')

      expect(() => handleNetworkError(error)).toThrow(ApiError)
      expect(() => handleNetworkError(error)).toThrow('ネットワーク接続エラー')
    })

    it('ApiErrorはそのままthrowする', () => {
      const apiError = new ApiError('既存のAPIエラー', 500, 'server')

      expect(() => handleNetworkError(apiError)).toThrow(apiError)
    })

    it('デフォルトメッセージを指定できる', () => {
      const error = 'string error'

      expect(() =>
        handleNetworkError(error, 'カスタムネットワークエラー')
      ).toThrow('カスタムネットワークエラー')
    })

    it('throwされたApiErrorのタイプがnetworkになる', () => {
      const error = new Error('接続失敗')

      try {
        handleNetworkError(error)
        expect.fail('エラーがthrowされるべきです')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        if (e instanceof ApiError) {
          expect(e.type).toBe('network')
        }
      }
    })
  })
})
