import type { GroupMatching } from '@/features/group-matching/types/groupMatching'
import { parseNullableDate, parseDate } from '@/utils/date'

/**
 * APIレスポンスからGroupMatchingオブジェクトに変換
 */
export function parseGroupMatching(data: {
	id: string
	guestId: string
	chatRoomId: string | null
	status: string
	proposedDate: string
	proposedDuration: number
	proposedLocation: string
	requestedCastCount: number
	totalPoints: number
	startedAt: string | null
	scheduledEndAt: string | null
	actualEndAt: string | null
	extensionMinutes: number
	extensionPoints: number
	recruitingEndedAt: string | null
	createdAt: string
	updatedAt: string
}): GroupMatching {
	return {
		id: data.id,
		guestId: data.guestId,
		chatRoomId: data.chatRoomId,
		status: data.status as GroupMatching['status'],
		proposedDate: parseDate(data.proposedDate),
		proposedDuration: data.proposedDuration,
		proposedLocation: data.proposedLocation,
		requestedCastCount: data.requestedCastCount,
		totalPoints: data.totalPoints,
		startedAt: parseNullableDate(data.startedAt),
		scheduledEndAt: parseNullableDate(data.scheduledEndAt),
		actualEndAt: parseNullableDate(data.actualEndAt),
		extensionMinutes: data.extensionMinutes,
		extensionPoints: data.extensionPoints,
		recruitingEndedAt: parseNullableDate(data.recruitingEndedAt),
		createdAt: parseDate(data.createdAt),
		updatedAt: parseDate(data.updatedAt),
	}
}
