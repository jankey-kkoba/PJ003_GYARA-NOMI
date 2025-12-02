/**
 * キャスト一覧の1ページあたりの表示数
 */
export const CASTS_PER_PAGE = 12

/**
 * キャストランクの定義
 * ランク1が最も低く、ランク5が最も高い
 */
export const CAST_RANKS = [1, 2, 3, 4, 5] as const
export type CastRank = (typeof CAST_RANKS)[number]

/**
 * ランク別時給（ポイント/時間）
 * キャストのランクに応じた時給を定義
 */
export const RANK_HOURLY_RATES: Record<CastRank, number> = {
	1: 3000, // ランク1: 3000ポイント/時間
	2: 4000, // ランク2: 4000ポイント/時間
	3: 5000, // ランク3: 5000ポイント/時間
	4: 7000, // ランク4: 7000ポイント/時間
	5: 10000, // ランク5: 10000ポイント/時間
} as const

/**
 * キャストのランクから時給を取得する
 * @param rank - キャストのランク
 * @returns 時給（ポイント/時間）。不正なランクの場合はランク1の時給を返す
 */
export function getHourlyRateByRank(rank: number): number {
	if (rank in RANK_HOURLY_RATES) {
		return RANK_HOURLY_RATES[rank as CastRank]
	}
	// 不正なランクの場合はランク1の時給を返す
	return RANK_HOURLY_RATES[1]
}

/**
 * ランク名を取得する
 * @param rank - キャストのランク
 * @returns ランク名
 */
export function getRankName(rank: number): string {
	const rankNames: Record<CastRank, string> = {
		1: 'ブロンズ',
		2: 'シルバー',
		3: 'ゴールド',
		4: 'プラチナ',
		5: 'ダイヤモンド',
	}
	if (rank in rankNames) {
		return rankNames[rank as CastRank]
	}
	return 'ブロンズ'
}
