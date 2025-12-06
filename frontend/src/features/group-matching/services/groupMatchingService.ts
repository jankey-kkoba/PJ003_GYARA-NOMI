import { db } from '@/libs/db'
import { matchings, matchingParticipants } from '@/libs/db/schema'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { userProfiles } from '@/libs/db/schema/users'
import type { CreateGroupMatchingResult } from '@/features/group-matching/types/groupMatching'
import {
	addMinutesToDate,
	subtractYears,
	addDaysToDate,
	formatDateOnly,
} from '@/utils/date'
import { calculatePoints } from '@/utils/points'
import { RANK_HOURLY_RATES } from '@/features/cast/constants'
import { eq, and, gte, lte, type SQL } from 'drizzle-orm'

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
}
