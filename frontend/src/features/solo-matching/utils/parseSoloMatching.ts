import { parseDate, parseNullableDate } from '@/utils/date'
import type {
	SoloMatching,
	MatchingStatus,
} from '@/features/solo-matching/types/soloMatching'

/**
 * APIレスポンスのSoloMatchingの型（日付が文字列）
 */
type ApiSoloMatching = {
	id: string
	guestId: string
	castId: string
	chatRoomId: string | null
	status: MatchingStatus
	proposedDate: string
	proposedDuration: number
	proposedLocation: string
	hourlyRate: number
	totalPoints: number
	startedAt: string | null
	scheduledEndAt: string | null
	actualEndAt: string | null
	extensionMinutes: number
	extensionPoints: number
	castRespondedAt: string | null
	createdAt: string
	updatedAt: string
}

/**
 * APIレスポンスのSoloMatchingをフロントエンド用の型に変換する
 * 日付文字列をDateオブジェクトに変換する
 */
export function parseSoloMatching(apiMatching: ApiSoloMatching): SoloMatching {
	return {
		...apiMatching,
		proposedDate: parseDate(apiMatching.proposedDate),
		startedAt: parseNullableDate(apiMatching.startedAt),
		scheduledEndAt: parseNullableDate(apiMatching.scheduledEndAt),
		actualEndAt: parseNullableDate(apiMatching.actualEndAt),
		castRespondedAt: parseNullableDate(apiMatching.castRespondedAt),
		createdAt: parseDate(apiMatching.createdAt),
		updatedAt: parseDate(apiMatching.updatedAt),
	}
}

/**
 * APIレスポンスのSoloMatching配列をフロントエンド用の型に変換する
 */
export function parseSoloMatchings(
	apiMatchings: ApiSoloMatching[],
): SoloMatching[] {
	return apiMatchings.map(parseSoloMatching)
}

/**
 * APIレスポンスのnullable SoloMatchingをフロントエンド用の型に変換する
 */
export function parseSoloMatchingOrNull(
	apiMatching: ApiSoloMatching | null,
): SoloMatching | null {
	if (!apiMatching) {
		return null
	}
	return parseSoloMatching(apiMatching)
}
