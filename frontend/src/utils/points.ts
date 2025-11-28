/**
 * ポイント計算に関するユーティリティ関数
 */

/**
 * 時間とレートからポイントを計算する
 * @param durationMinutes - 時間（分）
 * @param hourlyRate - 時給（ポイント/時間）
 * @returns 計算されたポイント
 */
export function calculatePoints(
	durationMinutes: number,
	hourlyRate: number,
): number {
	return Math.round((durationMinutes / 60) * hourlyRate)
}
