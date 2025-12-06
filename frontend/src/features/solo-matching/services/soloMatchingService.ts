import { db } from '@/libs/db'
import { matchings, matchingParticipants } from '@/libs/db/schema'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { userProfiles } from '@/libs/db/schema/users'
import type {
	SoloMatching,
	CastSoloMatching,
} from '@/features/solo-matching/types/soloMatching'
import { addMinutesToDate } from '@/utils/date'
import { calculatePoints } from '@/utils/points'
import { getHourlyRateByRank } from '@/features/cast/constants'
import { eq, desc, and } from 'drizzle-orm'

/**
 * ソロマッチング作成の入力パラメータ
 * 時給はキャストのランクから自動計算されるため、パラメータには含めない
 */
export type CreateSoloMatchingParams = {
	guestId: string
	castId: string
	proposedDate?: Date
	proposedTimeOffsetMinutes?: number
	proposedDuration: number
	proposedLocation: string
}

/**
 * matchingsとmatching_participantsの結合結果からSoloMatchingへ変換するヘルパー関数
 * 時給（hourlyRate）はキャストのランクから動的に計算されるため、ここでは含めない
 */
function toSoloMatching(
	matching: typeof matchings.$inferSelect,
	participant: typeof matchingParticipants.$inferSelect,
): SoloMatching {
	return {
		id: matching.id,
		guestId: matching.guestId,
		castId: participant.castId,
		chatRoomId: matching.chatRoomId,
		status: matching.status,
		proposedDate: matching.proposedDate,
		proposedDuration: matching.proposedDuration,
		proposedLocation: matching.proposedLocation,
		totalPoints: matching.totalPoints,
		startedAt: matching.startedAt,
		scheduledEndAt: matching.scheduledEndAt,
		actualEndAt: matching.actualEndAt,
		extensionMinutes: matching.extensionMinutes ?? 0,
		extensionPoints: matching.extensionPoints ?? 0,
		castRespondedAt: participant.respondedAt,
		createdAt: matching.createdAt,
		updatedAt: matching.updatedAt,
	}
}

/**
 * ソロマッチングサービス
 * ソロマッチング関連のデータベース操作を提供
 */
export const soloMatchingService = {
	/**
	 * ソロマッチングオファーを作成
	 * 時給はキャストのランクから自動計算される
	 * @param params - マッチングオファー情報
	 * @returns 作成されたソロマッチング
	 */
	async createSoloMatching(
		params: CreateSoloMatchingParams,
	): Promise<SoloMatching> {
		const {
			guestId,
			castId,
			proposedDate,
			proposedTimeOffsetMinutes,
			proposedDuration,
			proposedLocation,
		} = params

		// proposedDateを決定（proposedTimeOffsetMinutesが指定されている場合はサーバー時刻で計算）
		const finalProposedDate = proposedTimeOffsetMinutes
			? addMinutesToDate(new Date(), proposedTimeOffsetMinutes).toISOString()
			: proposedDate?.toISOString()

		if (!finalProposedDate) {
			throw new Error(
				'proposedDate または proposedTimeOffsetMinutes のいずれかを指定してください',
			)
		}

		// キャストのランクを取得
		const [castProfile] = await db
			.select({ rank: castProfiles.rank })
			.from(castProfiles)
			.where(eq(castProfiles.id, castId))
			.limit(1)

		if (!castProfile) {
			throw new Error('キャストが見つかりません')
		}

		// 時給をランクから計算
		const hourlyRate = getHourlyRateByRank(castProfile.rank)

		// 合計ポイントを計算（時給 × 時間）
		const totalPoints = calculatePoints(proposedDuration, hourlyRate)

		// matchingsにinsert（IDはスキーマの$defaultFnで自動生成される）
		const [matchingResult] = await db
			.insert(matchings)
			.values({
				type: 'solo',
				guestId,
				proposedDate: finalProposedDate,
				proposedDuration,
				proposedLocation,
				requestedCastCount: 1,
				totalPoints,
				chatRoomId: null,
			})
			.returning()

		// matching_participantsにinsert（IDはスキーマの$defaultFnで自動生成される）
		const [participantResult] = await db
			.insert(matchingParticipants)
			.values({
				matchingId: matchingResult.id,
				castId,
				status: 'pending',
			})
			.returning()

		return toSoloMatching(matchingResult, participantResult)
	},

	/**
	 * ゲストのソロマッチング一覧を取得
	 * @param guestId - ゲストID
	 * @returns ゲストのソロマッチング一覧（pending, accepted, rejected, cancelled, in_progress）
	 */
	async getGuestSoloMatchings(guestId: string): Promise<SoloMatching[]> {
		const results = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(and(eq(matchings.guestId, guestId), eq(matchings.type, 'solo')))
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

		return filteredResults.map((result) =>
			toSoloMatching(result.matching, result.participant),
		)
	},

	/**
	 * キャストのソロマッチング一覧を取得（ゲスト情報付き）
	 * @param castId - キャストID
	 * @returns キャストのソロマッチング一覧（pending, accepted, in_progressのみ）
	 */
	async getCastSoloMatchings(castId: string): Promise<CastSoloMatching[]> {
		const results = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
				guestProfile: userProfiles,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.innerJoin(userProfiles, eq(matchings.guestId, userProfiles.id))
			.where(
				and(
					eq(matchingParticipants.castId, castId),
					eq(matchings.type, 'solo'),
				),
			)
			.orderBy(desc(matchings.createdAt))

		// フィルタリング: pending, accepted, in_progress のみ（回答待ち、成立、進行中のマッチング）
		const filteredResults = results.filter(
			(result) =>
				result.matching.status === 'pending' ||
				result.matching.status === 'accepted' ||
				result.matching.status === 'in_progress',
		)

		return filteredResults.map((result) => ({
			...toSoloMatching(result.matching, result.participant),
			guest: {
				id: result.matching.guestId,
				nickname: result.guestProfile.name,
			},
		}))
	},

	/**
	 * キャストがソロマッチングに回答する
	 * @param matchingId - マッチングID
	 * @param castId - キャストID
	 * @param response - 回答 ('accepted' or 'rejected')
	 * @returns 更新されたソロマッチング
	 */
	async respondToSoloMatching(
		matchingId: string,
		castId: string,
		response: 'accepted' | 'rejected',
	): Promise<SoloMatching> {
		// マッチングと参加者を取得
		const [result] = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(eq(matchings.id, matchingId))

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたキャストIDがマッチングのcast_idと一致するか
		if (result.participant.castId !== castId) {
			throw new Error('このマッチングに回答する権限がありません')
		}

		// ステータスチェック: pending のみ回答可能
		if (result.matching.status !== 'pending') {
			throw new Error('このマッチングは既に回答済みです')
		}

		const now = new Date().toISOString()

		// マッチングのステータスを更新
		const [updatedMatching] = await db
			.update(matchings)
			.set({
				status: response,
				recruitingEndedAt: now,
				updatedAt: now,
			})
			.where(eq(matchings.id, matchingId))
			.returning()

		// 参加者のステータスを更新
		const [updatedParticipant] = await db
			.update(matchingParticipants)
			.set({
				status: response,
				respondedAt: now,
				updatedAt: now,
			})
			.where(eq(matchingParticipants.id, result.participant.id))
			.returning()

		return toSoloMatching(updatedMatching, updatedParticipant)
	},

	/**
	 * キャストがソロマッチングを開始する（合流ボタン押下時）
	 * @param matchingId - マッチングID
	 * @param castId - キャストID
	 * @returns 更新されたソロマッチング
	 */
	async startSoloMatching(
		matchingId: string,
		castId: string,
	): Promise<SoloMatching> {
		// マッチングと参加者を取得
		const [result] = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(eq(matchings.id, matchingId))

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたキャストIDがマッチングのcast_idと一致するか
		if (result.participant.castId !== castId) {
			throw new Error('このマッチングを開始する権限がありません')
		}

		// ステータスチェック: accepted のみ開始可能
		if (result.matching.status !== 'accepted') {
			throw new Error(
				'このマッチングは開始できません（成立済みマッチングのみ開始可能です）',
			)
		}

		// 開始時刻と予定終了時刻を計算
		const now = new Date()
		const scheduledEnd = addMinutesToDate(now, result.matching.proposedDuration)
		const nowIso = now.toISOString()
		const scheduledEndIso = scheduledEnd.toISOString()

		// マッチングのステータスを更新
		const [updatedMatching] = await db
			.update(matchings)
			.set({
				status: 'in_progress',
				startedAt: nowIso,
				scheduledEndAt: scheduledEndIso,
				updatedAt: nowIso,
			})
			.where(eq(matchings.id, matchingId))
			.returning()

		// 参加者のステータスを更新
		const [updatedParticipant] = await db
			.update(matchingParticipants)
			.set({
				status: 'joined',
				joinedAt: nowIso,
				updatedAt: nowIso,
			})
			.where(eq(matchingParticipants.id, result.participant.id))
			.returning()

		return toSoloMatching(updatedMatching, updatedParticipant)
	},

	/**
	 * キャストがソロマッチングを終了する（終了ボタン押下時）
	 * @param matchingId - マッチングID
	 * @param castId - キャストID
	 * @returns 更新されたソロマッチング
	 */
	async completeSoloMatching(
		matchingId: string,
		castId: string,
	): Promise<SoloMatching> {
		// マッチングと参加者を取得
		const [result] = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(eq(matchings.id, matchingId))

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたキャストIDがマッチングのcast_idと一致するか
		if (result.participant.castId !== castId) {
			throw new Error('このマッチングを終了する権限がありません')
		}

		// ステータスチェック: in_progress のみ終了可能
		if (result.matching.status !== 'in_progress') {
			throw new Error(
				'このマッチングは終了できません（進行中のマッチングのみ終了可能です）',
			)
		}

		const now = new Date().toISOString()

		// マッチングのステータスを更新
		const [updatedMatching] = await db
			.update(matchings)
			.set({
				status: 'completed',
				actualEndAt: now,
				updatedAt: now,
			})
			.where(eq(matchings.id, matchingId))
			.returning()

		// 参加者のステータスを更新
		const [updatedParticipant] = await db
			.update(matchingParticipants)
			.set({
				status: 'completed',
				updatedAt: now,
			})
			.where(eq(matchingParticipants.id, result.participant.id))
			.returning()

		return toSoloMatching(updatedMatching, updatedParticipant)
	},

	/**
	 * ゲストがソロマッチングを延長する
	 * @param matchingId - マッチングID
	 * @param guestId - ゲストID
	 * @param extensionMinutes - 延長時間（分）30分単位
	 * @returns 更新されたソロマッチング
	 */
	async extendSoloMatching(
		matchingId: string,
		guestId: string,
		extensionMinutes: number,
	): Promise<SoloMatching> {
		// マッチングと参加者を取得
		const [result] = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(eq(matchings.id, matchingId))

		if (!result) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたゲストIDがマッチングのguest_idと一致するか
		if (result.matching.guestId !== guestId) {
			throw new Error('このマッチングを延長する権限がありません')
		}

		// ステータスチェック: in_progress のみ延長可能
		if (result.matching.status !== 'in_progress') {
			throw new Error(
				'このマッチングは延長できません（進行中のマッチングのみ延長可能です）',
			)
		}

		// 終了予定時刻が存在することを確認
		if (!result.matching.scheduledEndAt) {
			throw new Error('予定終了時刻が設定されていません')
		}

		// 新しい予定終了時刻を計算（ISO文字列をパースして計算し、再度ISO文字列に変換）
		const newScheduledEndAt = addMinutesToDate(
			new Date(result.matching.scheduledEndAt),
			extensionMinutes,
		).toISOString()

		// キャストのランクを取得して時給を計算
		const [castProfile] = await db
			.select({ rank: castProfiles.rank })
			.from(castProfiles)
			.where(eq(castProfiles.id, result.participant.castId))
			.limit(1)

		if (!castProfile) {
			throw new Error('キャスト情報が見つかりません')
		}

		const hourlyRate = getHourlyRateByRank(castProfile.rank)

		// 延長ポイントを計算（時給 × 時間）
		const additionalPoints = calculatePoints(extensionMinutes, hourlyRate)

		// 累積値を計算
		const newExtensionMinutes =
			(result.matching.extensionMinutes ?? 0) + extensionMinutes
		const newExtensionPoints =
			(result.matching.extensionPoints ?? 0) + additionalPoints
		const newTotalPoints = result.matching.totalPoints + additionalPoints

		// マッチングを更新
		const [updatedMatching] = await db
			.update(matchings)
			.set({
				scheduledEndAt: newScheduledEndAt,
				extensionMinutes: newExtensionMinutes,
				extensionPoints: newExtensionPoints,
				totalPoints: newTotalPoints,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(matchings.id, matchingId))
			.returning()

		return toSoloMatching(updatedMatching, result.participant)
	},

	/**
	 * ゲストの完了済みソロマッチング一覧を取得
	 * @param guestId - ゲストID
	 * @returns 完了済みのソロマッチング一覧
	 */
	async getCompletedSoloMatchings(guestId: string): Promise<SoloMatching[]> {
		const results = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(and(eq(matchings.guestId, guestId), eq(matchings.type, 'solo')))
			.orderBy(desc(matchings.actualEndAt))

		// フィルタリング: completed のみ
		const filteredResults = results.filter(
			(result) => result.matching.status === 'completed',
		)

		return filteredResults.map((result) =>
			toSoloMatching(result.matching, result.participant),
		)
	},

	/**
	 * ゲストが指定キャストに対して送信中（回答待ち）のオファーを取得
	 * @param guestId - ゲストID
	 * @param castId - キャストID
	 * @returns 回答待ちのオファーがあればそのオファー、なければnull
	 */
	async getPendingOfferForCast(
		guestId: string,
		castId: string,
	): Promise<SoloMatching | null> {
		const [result] = await db
			.select({
				matching: matchings,
				participant: matchingParticipants,
			})
			.from(matchings)
			.innerJoin(
				matchingParticipants,
				eq(matchings.id, matchingParticipants.matchingId),
			)
			.where(
				and(
					eq(matchings.guestId, guestId),
					eq(matchingParticipants.castId, castId),
					eq(matchings.status, 'pending'),
					eq(matchings.type, 'solo'),
				),
			)
			.limit(1)

		if (!result) {
			return null
		}

		return toSoloMatching(result.matching, result.participant)
	},
}
