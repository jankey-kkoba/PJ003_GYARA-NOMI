/**
 * APIエラーの種類
 */
export type ApiErrorType =
	| 'validation' // バリデーションエラー
	| 'authentication' // 認証エラー
	| 'authorization' // 認可エラー
	| 'not_found' // リソースが見つからない
	| 'server' // サーバーエラー
	| 'network' // ネットワークエラー
	| 'unknown' // 不明なエラー

/**
 * APIエラークラス
 * API通信で発生したエラーの詳細情報を保持する
 */
export class ApiError extends Error {
	/**
	 * HTTPステータスコード
	 */
	public readonly statusCode?: number

	/**
	 * エラーの種類
	 */
	public readonly type: ApiErrorType

	/**
	 * サーバーから返却された元のエラーデータ
	 */
	public readonly originalError?: unknown

	constructor(
		message: string,
		statusCode?: number,
		type: ApiErrorType = 'unknown',
		originalError?: unknown,
	) {
		super(message)
		this.name = 'ApiError'
		this.statusCode = statusCode
		this.type = type
		this.originalError = originalError

		// TypeScriptのエラー継承のための設定
		Object.setPrototypeOf(this, ApiError.prototype)
	}

	/**
	 * HTTPステータスコードからエラータイプを推測する
	 */
	static inferTypeFromStatus(statusCode: number): ApiErrorType {
		if (statusCode === 400) return 'validation'
		if (statusCode === 401) return 'authentication'
		if (statusCode === 403) return 'authorization'
		if (statusCode === 404) return 'not_found'
		if (statusCode >= 500) return 'server'
		return 'unknown'
	}

	/**
	 * ユーザーに表示するべきかどうか
	 * 認証エラーなど、一部のエラーはtoast表示しない方が良い場合がある
	 */
	shouldShowToUser(): boolean {
		// 認証エラーはリダイレクト処理などで対応されるため、toast表示不要
		return this.type !== 'authentication'
	}
}
