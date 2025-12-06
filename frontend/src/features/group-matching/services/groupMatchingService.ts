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
import {
	RANK_HOURLY_RATES,
	getHourlyRateByRank,
} from '@/features/cast/constants'
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
			? addMinutesToDate(new Date(), proposedTimeOffsetMinutes).toISOString()
			: proposedDate!.toISOString()

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

		// 条件に合うキャストが0人の場合
		if (activeCasts.length === 0) {
			return {
				matching: null,
				participantCount: 0,
			}
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
	 * キャストがグループマッチングオファーに回答する
	 * @param matchingId - マッチングID
	 * @param castId - キャストID
	 * @param response - 回答 ('accepted' or 'rejected')
	 * @returns 更新されたキャスト向けグループマッチング情報
	 */
	async respondToGroupMatching(
		matchingId: string,
		castId: string,
		response: 'accepted' | 'rejected',
	): Promise<CastGroupMatching> {
		// マッチングと参加者を取得
		const [result] = await db
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
					eq(matchingParticipants.matchingId, matchingId),
					eq(matchingParticipants.castId, castId),
				),
			)

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// マッチングタイプチェック
		if (result.matching.type !== 'group') {
			throw new Error('グループマッチングではありません')
		}

		// ステータスチェック: pending のみ回答可能
		if (result.participant.status !== 'pending') {
			throw new Error('このオファーは既に回答済みです')
		}

		// マッチング全体のステータスチェック: pending のみ回答可能
		if (result.matching.status !== 'pending') {
			throw new Error('このマッチングは既に締め切られています')
		}

		const now = new Date().toISOString()

		// 参加者のステータスを更新
		await db
			.update(matchingParticipants)
			.set({
				status: response,
				respondedAt: now,
				updatedAt: now,
			})
			.where(eq(matchingParticipants.id, result.participant.id))

		// 参加者サマリーを取得
		const participants = await db
			.select({ status: matchingParticipants.status })
			.from(matchingParticipants)
			.where(eq(matchingParticipants.matchingId, matchingId))

		const participantSummary = {
			requestedCount: result.matching.requestedCastCount ?? 1,
			acceptedCount: participants.filter((p) => p.status === 'accepted').length,
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
			participantStatus: response,
			guest: {
				id: result.matching.guestId,
				nickname: result.guestName,
			},
			participantSummary,
		}
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

	/**
	 * キャストがグループマッチングを開始する（合流ボタン押下時）
	 * - 参加者のステータスを 'accepted' → 'joined' に変更
	 * - 最初のキャストが合流した場合、マッチング全体を 'in_progress' に変更
	 * @param matchingId - マッチングID
	 * @param castId - キャストID
	 * @returns 更新されたキャスト向けグループマッチング情報
	 */
	async startGroupMatching(
		matchingId: string,
		castId: string,
	): Promise<CastGroupMatching> {
		// マッチングと参加者を取得
		const [result] = await db
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
					eq(matchingParticipants.matchingId, matchingId),
					eq(matchingParticipants.castId, castId),
				),
			)

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// マッチングタイプチェック
		if (result.matching.type !== 'group') {
			throw new Error('グループマッチングではありません')
		}

		// 権限チェック: 参加者のステータスが 'accepted' のみ合流可能
		if (result.participant.status !== 'accepted') {
			throw new Error('このマッチングに合流する権限がありません')
		}

		// マッチング全体のステータスチェック: 'accepted' または 'in_progress' のみ合流可能
		if (
			result.matching.status !== 'accepted' &&
			result.matching.status !== 'in_progress'
		) {
			throw new Error(
				'このマッチングは開始できません（成立済みマッチングのみ開始可能です）',
			)
		}

		const now = new Date()
		const nowIso = now.toISOString()

		// 参加者のステータスを更新
		await db
			.update(matchingParticipants)
			.set({
				status: 'joined',
				joinedAt: nowIso,
				updatedAt: nowIso,
			})
			.where(eq(matchingParticipants.id, result.participant.id))

		// マッチングがまだ 'accepted' の場合、最初の合流なので 'in_progress' に変更
		let updatedMatchingStatus = result.matching.status
		let startedAt: string | null = result.matching.startedAt
		let scheduledEndAt: string | null = result.matching.scheduledEndAt

		if (result.matching.status === 'accepted') {
			scheduledEndAt = addMinutesToDate(
				now,
				result.matching.proposedDuration,
			).toISOString()
			await db
				.update(matchings)
				.set({
					status: 'in_progress',
					startedAt: nowIso,
					scheduledEndAt,
					updatedAt: nowIso,
				})
				.where(eq(matchings.id, matchingId))

			updatedMatchingStatus = 'in_progress'
			startedAt = nowIso
		}

		// 参加者サマリーを取得
		const participants = await db
			.select({ status: matchingParticipants.status })
			.from(matchingParticipants)
			.where(eq(matchingParticipants.matchingId, matchingId))

		const participantSummary = {
			requestedCount: result.matching.requestedCastCount ?? 1,
			acceptedCount: participants.filter((p) => p.status === 'accepted').length,
			joinedCount: participants.filter((p) => p.status === 'joined').length,
		}

		return {
			id: result.matching.id,
			guestId: result.matching.guestId,
			chatRoomId: result.matching.chatRoomId,
			status: updatedMatchingStatus,
			proposedDate: result.matching.proposedDate,
			proposedDuration: result.matching.proposedDuration,
			proposedLocation: result.matching.proposedLocation,
			requestedCastCount: result.matching.requestedCastCount ?? 1,
			totalPoints: result.matching.totalPoints,
			startedAt,
			scheduledEndAt,
			actualEndAt: result.matching.actualEndAt,
			extensionMinutes: result.matching.extensionMinutes ?? 0,
			extensionPoints: result.matching.extensionPoints ?? 0,
			recruitingEndedAt: result.matching.recruitingEndedAt,
			createdAt: result.matching.createdAt,
			updatedAt: nowIso,
			type: 'group' as const,
			participantStatus: 'joined',
			guest: {
				id: result.matching.guestId,
				nickname: result.guestName,
			},
			participantSummary,
		}
	},

	/**
	 * キャストがグループマッチングを終了する（終了ボタン押下時）
	 * - 参加者のステータスを 'joined' → 'completed' に変更
	 * - 他のキャストには影響しない（そのキャストのみ終了）
	 * @param matchingId - マッチングID
	 * @param castId - キャストID
	 * @returns 更新されたキャスト向けグループマッチング情報
	 */
	async completeGroupMatching(
		matchingId: string,
		castId: string,
	): Promise<CastGroupMatching> {
		// マッチングと参加者を取得
		const [result] = await db
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
					eq(matchingParticipants.matchingId, matchingId),
					eq(matchingParticipants.castId, castId),
				),
			)

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// マッチングタイプチェック
		if (result.matching.type !== 'group') {
			throw new Error('グループマッチングではありません')
		}

		// 権限チェック: 参加者のステータスが 'joined' のみ終了可能
		if (result.participant.status !== 'joined') {
			throw new Error('このマッチングを終了する権限がありません')
		}

		// マッチング全体のステータスチェック: 'in_progress' のみ終了可能
		if (result.matching.status !== 'in_progress') {
			throw new Error(
				'このマッチングは終了できません（進行中のマッチングのみ終了可能です）',
			)
		}

		const now = new Date().toISOString()

		// 参加者のステータスを更新
		await db
			.update(matchingParticipants)
			.set({
				status: 'completed',
				updatedAt: now,
			})
			.where(eq(matchingParticipants.id, result.participant.id))

		// 参加者サマリーを取得
		const participants = await db
			.select({ status: matchingParticipants.status })
			.from(matchingParticipants)
			.where(eq(matchingParticipants.matchingId, matchingId))

		const participantSummary = {
			requestedCount: result.matching.requestedCastCount ?? 1,
			acceptedCount: participants.filter((p) => p.status === 'accepted').length,
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
			updatedAt: now,
			type: 'group' as const,
			participantStatus: 'completed',
			guest: {
				id: result.matching.guestId,
				nickname: result.guestName,
			},
			participantSummary,
		}
	},

	/**
	 * ゲストがグループマッチングを延長する
	 * @param matchingId - マッチングID
	 * @param guestId - ゲストID
	 * @param extensionMinutes - 延長時間（分）30分単位
	 * @returns 更新されたゲスト向けグループマッチング情報
	 */
	async extendGroupMatching(
		matchingId: string,
		guestId: string,
		extensionMinutes: number,
	): Promise<GuestGroupMatching> {
		// マッチングを取得
		const [matchingResult] = await db
			.select({ matching: matchings })
			.from(matchings)
			.where(eq(matchings.id, matchingId))

		if (!matchingResult) {
			throw new Error('マッチングが見つかりません')
		}

		// マッチングタイプチェック
		if (matchingResult.matching.type !== 'group') {
			throw new Error('グループマッチングではありません')
		}

		// 権限チェック: 指定されたゲストIDがマッチングのguest_idと一致するか
		if (matchingResult.matching.guestId !== guestId) {
			throw new Error('このマッチングを延長する権限がありません')
		}

		// ステータスチェック: in_progress のみ延長可能
		if (matchingResult.matching.status !== 'in_progress') {
			throw new Error(
				'このマッチングは延長できません（進行中のマッチングのみ延長可能です）',
			)
		}

		// 終了予定時刻が存在することを確認
		if (!matchingResult.matching.scheduledEndAt) {
			throw new Error('予定終了時刻が設定されていません')
		}

		// 新しい予定終了時刻を計算（ISO文字列をパースして計算し、再度ISO文字列に変換）
		const newScheduledEndAt = addMinutesToDate(
			new Date(matchingResult.matching.scheduledEndAt),
			extensionMinutes,
		).toISOString()

		// 参加中（joined）のキャストを取得してポイントを計算
		const joinedParticipants = await db
			.select({
				castId: matchingParticipants.castId,
				rank: castProfiles.rank,
			})
			.from(matchingParticipants)
			.innerJoin(castProfiles, eq(matchingParticipants.castId, castProfiles.id))
			.where(
				and(
					eq(matchingParticipants.matchingId, matchingId),
					eq(matchingParticipants.status, 'joined'),
				),
			)

		if (joinedParticipants.length === 0) {
			throw new Error('参加中のキャストがいません')
		}

		// 各キャストの延長ポイントを計算して合計
		let additionalPoints = 0
		for (const participant of joinedParticipants) {
			const hourlyRate = getHourlyRateByRank(participant.rank)
			additionalPoints += calculatePoints(extensionMinutes, hourlyRate)
		}

		// 累積値を計算
		const newExtensionMinutes =
			(matchingResult.matching.extensionMinutes ?? 0) + extensionMinutes
		const newExtensionPoints =
			(matchingResult.matching.extensionPoints ?? 0) + additionalPoints
		const newTotalPoints =
			matchingResult.matching.totalPoints + additionalPoints

		const now = new Date().toISOString()

		// マッチングを更新
		await db
			.update(matchings)
			.set({
				scheduledEndAt: newScheduledEndAt,
				extensionMinutes: newExtensionMinutes,
				extensionPoints: newExtensionPoints,
				totalPoints: newTotalPoints,
				updatedAt: now,
			})
			.where(eq(matchings.id, matchingId))

		// 参加者サマリーを取得
		const participants = await db
			.select({ status: matchingParticipants.status })
			.from(matchingParticipants)
			.where(eq(matchingParticipants.matchingId, matchingId))

		const participantSummary = {
			pendingCount: participants.filter((p) => p.status === 'pending').length,
			acceptedCount: participants.filter((p) => p.status === 'accepted').length,
			rejectedCount: participants.filter((p) => p.status === 'rejected').length,
			joinedCount: participants.filter((p) => p.status === 'joined').length,
		}

		return {
			id: matchingResult.matching.id,
			guestId: matchingResult.matching.guestId,
			chatRoomId: matchingResult.matching.chatRoomId,
			status: matchingResult.matching.status,
			proposedDate: matchingResult.matching.proposedDate,
			proposedDuration: matchingResult.matching.proposedDuration,
			proposedLocation: matchingResult.matching.proposedLocation,
			requestedCastCount: matchingResult.matching.requestedCastCount ?? 1,
			totalPoints: newTotalPoints,
			startedAt: matchingResult.matching.startedAt,
			scheduledEndAt: newScheduledEndAt,
			actualEndAt: matchingResult.matching.actualEndAt,
			extensionMinutes: newExtensionMinutes,
			extensionPoints: newExtensionPoints,
			recruitingEndedAt: matchingResult.matching.recruitingEndedAt,
			createdAt: matchingResult.matching.createdAt,
			updatedAt: now,
			type: 'group' as const,
			participantSummary,
		}
	},
}
