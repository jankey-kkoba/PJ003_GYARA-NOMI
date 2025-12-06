import { db } from '@/libs/db'
import { matchings, matchingParticipants } from '@/libs/db/schema'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { userProfiles } from '@/libs/db/schema/users'
import type {
	CastGroupMatching,
	CreateGroupMatchingResult,
	GuestGroupMatching,
} from '@/features/group-matching/types/groupMatching'
import {
	addMinutesToDate,
	subtractYears,
	addDaysToDate,
	formatDateOnly,
} from '@/utils/date'
import { calculatePoints } from '@/utils/points'
import { RANK_HOURLY_RATES } from '@/features/cast/constants'
import { eq, and, gte, lte, desc, type SQL } from 'drizzle-orm'

/**
 * グループマッチング作成の入力パラメータ
 * 時給はブロンズランク（ランク1）の時給を基準に計算
 */
export type CreateGroupMatchingParams = {
	guestId: string
	requestedCastCount: number
	proposedDate?: Date
	proposedTimeOffsetMinutes?: number
	proposedDuration: number
	proposedLocation: string
	/** 最小年齢（絞り込み条件） */
	minAge?: number
	/** 最大年齢（絞り込み条件） */
	maxAge?: number
}

/**
 * グループマッチングサービス
 * グループマッチング関連のデータベース操作を提供
 */
export const groupMatchingService = {
	/**
	 * グループマッチングオファーを作成
	 * 全アクティブキャストにオファーを送信
	 * @param params - マッチングオファー情報
	 * @returns 作成されたグループマッチングと参加者数
	 */
	async createGroupMatching(
		params: CreateGroupMatchingParams,
	): Promise<CreateGroupMatchingResult> {
		const {
			guestId,
			requestedCastCount,
			proposedDate,
			proposedTimeOffsetMinutes,
			proposedDuration,
			proposedLocation,
			minAge,
			maxAge,
		} = params

		// proposedDateを決定（proposedTimeOffsetMinutesが指定されている場合はサーバー時刻で計算）
		// 注: proposedDateとproposedTimeOffsetMinutesの必須チェックはスキーマで行われる
		const finalProposedDate = proposedTimeOffsetMinutes
			? addMinutesToDate(new Date(), proposedTimeOffsetMinutes)
			: proposedDate!

		// ブロンズランク（ランク1）の時給を基準に合計ポイントを計算
		const baseHourlyRate = RANK_HOURLY_RATES[1]
		const totalPoints =
			calculatePoints(proposedDuration, baseHourlyRate) * requestedCastCount

		// WHERE条件を構築
		const conditions: SQL[] = [eq(castProfiles.isActive, true)]

		// 年齢フィルタリング（生年月日から計算）
		// minAge歳以上 = 生年月日がminAge年前の今日以前
		// maxAge歳以下 = 生年月日がmaxAge+1年前の今日より後
		const today = new Date()
		if (minAge !== undefined) {
			const maxBirthDate = subtractYears(today, minAge)
			conditions.push(lte(userProfiles.birthDate, formatDateOnly(maxBirthDate)))
		}
		if (maxAge !== undefined) {
			const minBirthDate = addDaysToDate(subtractYears(today, maxAge + 1), 1)
			conditions.push(gte(userProfiles.birthDate, formatDateOnly(minBirthDate)))
		}

		const whereClause = and(...conditions)

		// 条件に合うアクティブキャストを取得
		const activeCasts = await db
			.select({ id: castProfiles.id })
			.from(castProfiles)
			.innerJoin(userProfiles, eq(castProfiles.id, userProfiles.id))
			.where(whereClause)

		if (activeCasts.length === 0) {
			throw new Error('アクティブなキャストが見つかりません')
		}

		// matchingsにinsert
		const [matchingResult] = await db
			.insert(matchings)
			.values({
				type: 'group',
				guestId,
				proposedDate: finalProposedDate,
				proposedDuration,
				proposedLocation,
				requestedCastCount,
				totalPoints,
				chatRoomId: null,
			})
			.returning()

		// 全アクティブキャストをmatching_participantsにinsert
		const participantValues = activeCasts.map((cast) => ({
			matchingId: matchingResult.id,
			castId: cast.id,
			status: 'pending' as const,
		}))

		await db.insert(matchingParticipants).values(participantValues)

		return {
			matching: {
				id: matchingResult.id,
				guestId: matchingResult.guestId,
				chatRoomId: matchingResult.chatRoomId,
				status: matchingResult.status,
				proposedDate: matchingResult.proposedDate,
				proposedDuration: matchingResult.proposedDuration,
				proposedLocation: matchingResult.proposedLocation,
				requestedCastCount: matchingResult.requestedCastCount,
				totalPoints: matchingResult.totalPoints,
				startedAt: matchingResult.startedAt,
				scheduledEndAt: matchingResult.scheduledEndAt,
				actualEndAt: matchingResult.actualEndAt,
				extensionMinutes: matchingResult.extensionMinutes ?? 0,
				extensionPoints: matchingResult.extensionPoints ?? 0,
				recruitingEndedAt: matchingResult.recruitingEndedAt,
				createdAt: matchingResult.createdAt,
				updatedAt: matchingResult.updatedAt,
			},
			participantCount: activeCasts.length,
		}
	},

	/**
	 * ゲストのグループマッチング一覧を取得
	 * @param guestId - ゲストID
	 * @returns ゲストのグループマッチング一覧（pending, accepted, rejected, cancelled, in_progress）
	 */
	async getGuestGroupMatchings(guestId: string): Promise<GuestGroupMatching[]> {
		// グループマッチングを取得
		const results = await db
			.select({
				matching: matchings,
			})
			.from(matchings)
			.where(and(eq(matchings.guestId, guestId), eq(matchings.type, 'group')))
			.orderBy(desc(matchings.createdAt))

		// フィルタリング: pending, accepted, rejected, cancelled, in_progress
		const filteredResults = results.filter(
			(result) =>
				result.matching.status === 'pending' ||
				result.matching.status === 'accepted' ||
				result.matching.status === 'rejected' ||
				result.matching.status === 'cancelled' ||
				result.matching.status === 'in_progress',
		)

		// 各マッチングの参加者サマリーを取得
		const groupMatchings: GuestGroupMatching[] = await Promise.all(
			filteredResults.map(async (result) => {
				// 参加者を取得してサマリーを計算
				const participants = await db
					.select({ status: matchingParticipants.status })
					.from(matchingParticipants)
					.where(eq(matchingParticipants.matchingId, result.matching.id))

				const participantSummary = {
					pendingCount: participants.filter((p) => p.status === 'pending')
						.length,
					acceptedCount: participants.filter((p) => p.status === 'accepted')
						.length,
					rejectedCount: participants.filter((p) => p.status === 'rejected')
						.length,
					joinedCount: participants.filter((p) => p.status === 'joined').length,
				}

				return {
					id: result.matching.id,
					guestId: result.matching.guestId,
					chatRoomId: result.matching.chatRoomId,
					status: result.matching.status,
					proposedDate: result.matching.proposedDate,
					proposedDuration: result.matching.proposedDuration,
					proposedLocation: result.matching.proposedLocation,
					requestedCastCount: result.matching.requestedCastCount ?? 1,
					totalPoints: result.matching.totalPoints,
					startedAt: result.matching.startedAt,
					scheduledEndAt: result.matching.scheduledEndAt,
					actualEndAt: result.matching.actualEndAt,
					extensionMinutes: result.matching.extensionMinutes ?? 0,
					extensionPoints: result.matching.extensionPoints ?? 0,
					recruitingEndedAt: result.matching.recruitingEndedAt,
					createdAt: result.matching.createdAt,
					updatedAt: result.matching.updatedAt,
					type: 'group' as const,
					participantSummary,
				}
			}),
		)

		return groupMatchings
	},

	/**
	 * キャストのグループマッチング一覧を取得
	 * @param castId - キャストID
	 * @returns キャストが参加しているグループマッチング一覧（pending, accepted, in_progress）
	 */
	async getCastGroupMatchings(castId: string): Promise<CastGroupMatching[]> {
		// このキャストが参加者として含まれているグループマッチングを取得
		const results = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
				guestName: userProfiles.name,
			})
			.from(matchingParticipants)
			.innerJoin(matchings, eq(matchingParticipants.matchingId, matchings.id))
			.innerJoin(userProfiles, eq(matchings.guestId, userProfiles.id))
			.where(
				and(
					eq(matchingParticipants.castId, castId),
					eq(matchings.type, 'group'),
				),
			)
			.orderBy(desc(matchings.createdAt))

		// フィルタリング: キャストのステータスがpending, accepted, joined のマッチングのみ
		// またはマッチング自体がin_progressの場合
		const filteredResults = results.filter(
			(result) =>
				result.participant.status === 'pending' ||
				result.participant.status === 'accepted' ||
				result.participant.status === 'joined' ||
				result.matching.status === 'in_progress',
		)

		// 各マッチングの参加者サマリーを取得
		const groupMatchings: CastGroupMatching[] = await Promise.all(
			filteredResults.map(async (result) => {
				// 参加者を取得してサマリーを計算
				const participants = await db
					.select({ status: matchingParticipants.status })
					.from(matchingParticipants)
					.where(eq(matchingParticipants.matchingId, result.matching.id))

				const participantSummary = {
					requestedCount: result.matching.requestedCastCount ?? 1,
					acceptedCount: participants.filter((p) => p.status === 'accepted')
						.length,
					joinedCount: participants.filter((p) => p.status === 'joined').length,
				}

				return {
					id: result.matching.id,
					guestId: result.matching.guestId,
					chatRoomId: result.matching.chatRoomId,
					status: result.matching.status,
					proposedDate: result.matching.proposedDate,
					proposedDuration: result.matching.proposedDuration,
					proposedLocation: result.matching.proposedLocation,
					requestedCastCount: result.matching.requestedCastCount ?? 1,
					totalPoints: result.matching.totalPoints,
					startedAt: result.matching.startedAt,
					scheduledEndAt: result.matching.scheduledEndAt,
					actualEndAt: result.matching.actualEndAt,
					extensionMinutes: result.matching.extensionMinutes ?? 0,
					extensionPoints: result.matching.extensionPoints ?? 0,
					recruitingEndedAt: result.matching.recruitingEndedAt,
					createdAt: result.matching.createdAt,
					updatedAt: result.matching.updatedAt,
					type: 'group' as const,
					participantStatus: result.participant.status,
					guest: {
						id: result.matching.guestId,
						nickname: result.guestName,
					},
					participantSummary,
				}
			}),
		)

		return groupMatchings
	},
}
