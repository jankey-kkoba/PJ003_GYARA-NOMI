import {
	differenceInYears,
	subYears,
	addDays,
	addMinutes,
	formatISO,
} from 'date-fns'

/**
 * 誕生日から年齢を計算する
 * @param birthDate - 誕生日
 * @param baseDate - 基準日（デフォルトは現在日時）
 * @returns 年齢
 */
export function calculateAge(
	birthDate: Date,
	baseDate: Date = new Date(),
): number {
	return differenceInYears(baseDate, birthDate)
}

/**
 * 指定された年数を日付から減算する
 * @param date - 基準日
 * @param years - 減算する年数
 * @returns 減算後の日付
 */
export function subtractYears(date: Date, years: number): Date {
	return subYears(date, years)
}

/**
 * 指定された日数を日付に加算する
 * @param date - 基準日
 * @param days - 加算する日数
 * @returns 加算後の日付
 */
export function addDaysToDate(date: Date, days: number): Date {
	return addDays(date, days)
}

/**
 * 指定された分数を日付に加算する
 * @param date - 基準日
 * @param minutes - 加算する分数
 * @returns 加算後の日付
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
	return addMinutes(date, minutes)
}

/**
 * 日付をISO 8601形式の文字列に変換する（日付部分のみ）
 * @param date - 変換する日付
 * @returns YYYY-MM-DD形式の文字列
 */
export function formatDateOnly(date: Date): string {
	return formatISO(date, { representation: 'date' })
}

/**
 * 日付をISO 8601形式の文字列に変換する（完全な日時）
 * @param date - 変換する日付
 * @returns ISO 8601形式の文字列
 */
export function formatDateTime(date: Date): string {
	return formatISO(date)
}

/**
 * 日付文字列またはnullをDateオブジェクトまたはnullに変換する
 * @param dateString - 変換する日付文字列（nullも可）
 * @returns Dateオブジェクトまたはnull
 */
export function parseNullableDate(
	dateString: string | null | undefined,
): Date | null {
	if (!dateString) {
		return null
	}
	return new Date(dateString)
}

/**
 * 日付文字列をDateオブジェクトに変換する
 * @param dateString - 変換する日付文字列
 * @returns Dateオブジェクト
 */
export function parseDate(dateString: string): Date {
	return new Date(dateString)
}
