import { ApiError } from './errors'

/**
 * APIレスポンスのエラーデータの型
 */
type ApiErrorResponse = {
	error?: string
	message?: string
}

/**
 * APIレスポンスをチェックし、エラーの場合はApiErrorをthrowする
 * @param response - fetch APIのResponse
 * @param defaultMessage - エラーメッセージが取得できない場合のデフォルトメッセージ
 * @throws {ApiError} レスポンスがokでない場合
 */
export async function handleApiError(
	response: Response,
	defaultMessage: string = '通信エラーが発生しました',
): Promise<void> {
	if (response.ok) {
		return
	}

	const statusCode = response.status
	const errorType = ApiError.inferTypeFromStatus(statusCode)

	try {
		const errorData = (await response.json()) as ApiErrorResponse
		const errorMessage = errorData.error || errorData.message || defaultMessage

		throw new ApiError(errorMessage, statusCode, errorType, errorData)
	} catch (error) {
		// JSONのパースに失敗した場合
		if (error instanceof ApiError) {
			throw error
		}

		throw new ApiError(defaultMessage, statusCode, errorType, error)
	}
}

/**
 * APIレスポンスをチェックし、成功データを返す
 * エラーの場合はApiErrorをthrowする
 * @param response - fetch APIのResponse
 * @param defaultErrorMessage - エラーメッセージが取得できない場合のデフォルトメッセージ
 * @returns APIレスポンスのJSONデータ
 * @throws {ApiError} レスポンスがokでない場合
 */
export async function handleApiResponse<T>(
	response: Response,
	defaultErrorMessage: string = '通信エラーが発生しました',
): Promise<T> {
	await handleApiError(response, defaultErrorMessage)
	return response.json()
}

/**
 * ネットワークエラー(fetch自体が失敗)をハンドリングする
 * @param error - キャッチされたエラー
 * @param defaultMessage - デフォルトメッセージ
 * @throws {ApiError} 常にApiErrorをthrow
 */
export function handleNetworkError(
	error: unknown,
	defaultMessage: string = 'ネットワークエラーが発生しました',
): never {
	if (error instanceof ApiError) {
		throw error
	}

	const message = error instanceof Error ? error.message : defaultMessage

	throw new ApiError(message, undefined, 'network', error)
}
