/**
 * ルートパスの定数定義
 * ルートパスをハードコーディングせず、このファイルを経由して利用する
 * これにより画面フローが変わった時に修正がUIとE2Eテストだけで済む
 */

/**
 * 公開ページ（認証不要）
 */
export const ROUTES = {
	/** ホームページ */
	HOME: '/',
	/** ログインページ */
	LOGIN: '/login',
	/** 会員登録ページ */
	SIGN_UP: '/sign-up',
	/** ガイドページ */
	GUIDE: '/guide',
	/** 利用規約ページ */
	TERMS: '/terms',
	/** プライバシーポリシーページ */
	PRIVACY: '/privacy',
	/** FAQページ */
	FAQ: '/faq',

	/**
	 * キャスト関連
	 */
	CASTS: {
		/** キャスト一覧 */
		LIST: '/casts',
		/** キャスト詳細（動的パス生成用関数） */
		DETAIL: (castId: string) => `/casts/${castId}`,
		/** キャストとのチャット（動的パス生成用関数） */
		CHAT: (castId: string) => `/casts/${castId}/chat`,
	},

	/**
	 * プロフィール関連
	 */
	PROFILE: {
		/** プロフィール編集 */
		EDIT: '/profile/edit',
		/** プロフィール作成 */
		CREATE: '/profile/create',
	},
} as const

/**
 * 認証不要なパス一覧（ミドルウェアで使用）
 */
export const PUBLIC_PATHS = [
	ROUTES.LOGIN,
	ROUTES.SIGN_UP,
	ROUTES.GUIDE,
	ROUTES.TERMS,
	ROUTES.PRIVACY,
	ROUTES.FAQ,
] as const
