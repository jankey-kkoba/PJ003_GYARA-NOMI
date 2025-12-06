import type {
	CastGroupMatching,
	GroupMatching,
	GuestGroupMatching,
} from '@/features/group-matching/types/groupMatching'
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

/**
 * APIレスポンスからGuestGroupMatchingオブジェクトに変換
 */
export function parseGuestGroupMatching(data: {
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
	type: 'group'
	participantSummary: {
		pendingCount: number
		acceptedCount: number
		rejectedCount: number
		joinedCount: number
	}
}): GuestGroupMatching {
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
		type: 'group',
		participantSummary: data.participantSummary,
	}
}

/**
 * APIレスポンス配列からGuestGroupMatching配列に変換
 */
export function parseGuestGroupMatchings(
	data: Parameters<typeof parseGuestGroupMatching>[0][],
): GuestGroupMatching[] {
	return data.map(parseGuestGroupMatching)
}

/**
 * APIレスポンスからCastGroupMatchingオブジェクトに変換
 */
export function parseCastGroupMatching(data: {
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
	type: 'group'
	participantStatus: string
	guest: {
		id: string
		nickname: string
	}
	participantSummary: {
		requestedCount: number
		acceptedCount: number
		joinedCount: number
	}
}): CastGroupMatching {
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
		type: 'group',
		participantStatus:
			data.participantStatus as CastGroupMatching['participantStatus'],
		guest: data.guest,
		participantSummary: data.participantSummary,
	}
}

/**
 * APIレスポンス配列からCastGroupMatching配列に変換
 */
export function parseCastGroupMatchings(
	data: Parameters<typeof parseCastGroupMatching>[0][],
): CastGroupMatching[] {
	return data.map(parseCastGroupMatching)
}
