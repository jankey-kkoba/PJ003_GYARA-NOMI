import { db } from '@/libs/db'
import { soloMatchings } from '@/libs/db/schema/solo-matchings'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { addMinutesToDate } from '@/utils/date'
import { eq, desc } from 'drizzle-orm'

/**
 * ソロマッチング作成の入力パラメータ
 */
export type CreateSoloMatchingParams = {
	guestId: string
	castId: string
	proposedDate?: Date
	proposedTimeOffsetMinutes?: number
	proposedDuration: number
	proposedLocation: string
	hourlyRate: number
}

/**
 * ソロマッチングサービス
 * ソロマッチング関連のデータベース操作を提供
 */
export const soloMatchingService = {
	/**
	 * ソロマッチングオファーを作成
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
			hourlyRate,
		} = params

		// proposedDateを決定（proposedTimeOffsetMinutesが指定されている場合はサーバー時刻で計算）
		const finalProposedDate = proposedTimeOffsetMinutes
			? addMinutesToDate(new Date(), proposedTimeOffsetMinutes)
			: proposedDate

		if (!finalProposedDate) {
			throw new Error(
				'proposedDate または proposedTimeOffsetMinutes のいずれかを指定してください',
			)
		}

		// 合計ポイントを計算（時給 × 時間）
		const totalPoints = Math.round((proposedDuration / 60) * hourlyRate)

		const [result] = await db
			.insert(soloMatchings)
			.values({
				guestId,
				castId,
				proposedDate: finalProposedDate,
				proposedDuration,
				proposedLocation,
				hourlyRate,
				totalPoints,
				chatRoomId: null, // チャット機能実装時に対応
			})
			.returning()

		// DB型からアプリケーション型に変換
		return {
			id: result.id,
			guestId: result.guestId,
			castId: result.castId,
			chatRoomId: result.chatRoomId,
			status: result.status,
			proposedDate: result.proposedDate,
			proposedDuration: result.proposedDuration,
			proposedLocation: result.proposedLocation,
			hourlyRate: result.hourlyRate,
			totalPoints: result.totalPoints,
			startedAt: result.startedAt,
			scheduledEndAt: result.scheduledEndAt,
			actualEndAt: result.actualEndAt,
			extensionMinutes: result.extensionMinutes ?? 0,
			extensionPoints: result.extensionPoints ?? 0,
			castRespondedAt: result.castRespondedAt,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		}
	},

	/**
	 * ゲストのソロマッチング一覧を取得
	 * @param guestId - ゲストID
	 * @returns ゲストのソロマッチング一覧（pending, accepted, rejected, cancelledのみ）
	 */
	async getGuestSoloMatchings(guestId: string): Promise<SoloMatching[]> {
		const results = await db
			.select()
			.from(soloMatchings)
			.where(eq(soloMatchings.guestId, guestId))
			.orderBy(desc(soloMatchings.createdAt))

		// フィルタリング: pending, accepted, rejected, cancelled のみ
		const filteredResults = results.filter(
			(result) =>
				result.status === 'pending' ||
				result.status === 'accepted' ||
				result.status === 'rejected' ||
				result.status === 'cancelled',
		)

		// DB型からアプリケーション型に変換
		return filteredResults.map((result) => ({
			id: result.id,
			guestId: result.guestId,
			castId: result.castId,
			chatRoomId: result.chatRoomId,
			status: result.status,
			proposedDate: result.proposedDate,
			proposedDuration: result.proposedDuration,
			proposedLocation: result.proposedLocation,
			hourlyRate: result.hourlyRate,
			totalPoints: result.totalPoints,
			startedAt: result.startedAt,
			scheduledEndAt: result.scheduledEndAt,
			actualEndAt: result.actualEndAt,
			extensionMinutes: result.extensionMinutes ?? 0,
			extensionPoints: result.extensionPoints ?? 0,
			castRespondedAt: result.castRespondedAt,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		}))
	},

	/**
	 * キャストのソロマッチング一覧を取得
	 * @param castId - キャストID
	 * @returns キャストのソロマッチング一覧（pending, accepted, in_progressのみ）
	 */
	async getCastSoloMatchings(castId: string): Promise<SoloMatching[]> {
		const results = await db
			.select()
			.from(soloMatchings)
			.where(eq(soloMatchings.castId, castId))
			.orderBy(desc(soloMatchings.createdAt))

		// フィルタリング: pending, accepted, in_progress のみ（回答待ち、成立、進行中のマッチング）
		const filteredResults = results.filter(
			(result) =>
				result.status === 'pending' ||
				result.status === 'accepted' ||
				result.status === 'in_progress',
		)

		// DB型からアプリケーション型に変換
		return filteredResults.map((result) => ({
			id: result.id,
			guestId: result.guestId,
			castId: result.castId,
			chatRoomId: result.chatRoomId,
			status: result.status,
			proposedDate: result.proposedDate,
			proposedDuration: result.proposedDuration,
			proposedLocation: result.proposedLocation,
			hourlyRate: result.hourlyRate,
			totalPoints: result.totalPoints,
			startedAt: result.startedAt,
			scheduledEndAt: result.scheduledEndAt,
			actualEndAt: result.actualEndAt,
			extensionMinutes: result.extensionMinutes ?? 0,
			extensionPoints: result.extensionPoints ?? 0,
			castRespondedAt: result.castRespondedAt,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
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
		// マッチングを取得
		const [matching] = await db
			.select()
			.from(soloMatchings)
			.where(eq(soloMatchings.id, matchingId))

		if (!matching) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたキャストIDがマッチングのcast_idと一致するか
		if (matching.castId !== castId) {
			throw new Error('このマッチングに回答する権限がありません')
		}

		// ステータスチェック: pending のみ回答可能
		if (matching.status !== 'pending') {
			throw new Error('このマッチングは既に回答済みです')
		}

		// ステータスを更新
		const [updated] = await db
			.update(soloMatchings)
			.set({
				status: response,
				castRespondedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(soloMatchings.id, matchingId))
			.returning()

		// DB型からアプリケーション型に変換
		return {
			id: updated.id,
			guestId: updated.guestId,
			castId: updated.castId,
			chatRoomId: updated.chatRoomId,
			status: updated.status,
			proposedDate: updated.proposedDate,
			proposedDuration: updated.proposedDuration,
			proposedLocation: updated.proposedLocation,
			hourlyRate: updated.hourlyRate,
			totalPoints: updated.totalPoints,
			startedAt: updated.startedAt,
			scheduledEndAt: updated.scheduledEndAt,
			actualEndAt: updated.actualEndAt,
			extensionMinutes: updated.extensionMinutes ?? 0,
			extensionPoints: updated.extensionPoints ?? 0,
			castRespondedAt: updated.castRespondedAt,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		}
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
		// マッチングを取得
		const [matching] = await db
			.select()
			.from(soloMatchings)
			.where(eq(soloMatchings.id, matchingId))

		if (!matching) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたキャストIDがマッチングのcast_idと一致するか
		if (matching.castId !== castId) {
			throw new Error('このマッチングを開始する権限がありません')
		}

		// ステータスチェック: accepted のみ開始可能
		if (matching.status !== 'accepted') {
			throw new Error(
				'このマッチングは開始できません（成立済みマッチングのみ開始可能です）',
			)
		}

		// 開始時刻と予定終了時刻を計算
		const now = new Date()
		const scheduledEnd = addMinutesToDate(now, matching.proposedDuration)

		// ステータスを更新
		const [updated] = await db
			.update(soloMatchings)
			.set({
				status: 'in_progress',
				startedAt: now,
				scheduledEndAt: scheduledEnd,
				updatedAt: now,
			})
			.where(eq(soloMatchings.id, matchingId))
			.returning()

		// DB型からアプリケーション型に変換
		return {
			id: updated.id,
			guestId: updated.guestId,
			castId: updated.castId,
			chatRoomId: updated.chatRoomId,
			status: updated.status,
			proposedDate: updated.proposedDate,
			proposedDuration: updated.proposedDuration,
			proposedLocation: updated.proposedLocation,
			hourlyRate: updated.hourlyRate,
			totalPoints: updated.totalPoints,
			startedAt: updated.startedAt,
			scheduledEndAt: updated.scheduledEndAt,
			actualEndAt: updated.actualEndAt,
			extensionMinutes: updated.extensionMinutes ?? 0,
			extensionPoints: updated.extensionPoints ?? 0,
			castRespondedAt: updated.castRespondedAt,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		}
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
		// マッチングを取得
		const [matching] = await db
			.select()
			.from(soloMatchings)
			.where(eq(soloMatchings.id, matchingId))

		if (!matching) {
			throw new Error('マッチングが見つかりません')
		}

		// 権限チェック: 指定されたキャストIDがマッチングのcast_idと一致するか
		if (matching.castId !== castId) {
			throw new Error('このマッチングを終了する権限がありません')
		}

		// ステータスチェック: in_progress のみ終了可能
		if (matching.status !== 'in_progress') {
			throw new Error(
				'このマッチングは終了できません（進行中のマッチングのみ終了可能です）',
			)
		}

		// 終了時刻を記録
		const now = new Date()

		// ステータスを更新
		const [updated] = await db
			.update(soloMatchings)
			.set({
				status: 'completed',
				actualEndAt: now,
				updatedAt: now,
			})
			.where(eq(soloMatchings.id, matchingId))
			.returning()

		// DB型からアプリケーション型に変換
		return {
			id: updated.id,
			guestId: updated.guestId,
			castId: updated.castId,
			chatRoomId: updated.chatRoomId,
			status: updated.status,
			proposedDate: updated.proposedDate,
			proposedDuration: updated.proposedDuration,
			proposedLocation: updated.proposedLocation,
			hourlyRate: updated.hourlyRate,
			totalPoints: updated.totalPoints,
			startedAt: updated.startedAt,
			scheduledEndAt: updated.scheduledEndAt,
			actualEndAt: updated.actualEndAt,
			extensionMinutes: updated.extensionMinutes ?? 0,
			extensionPoints: updated.extensionPoints ?? 0,
			castRespondedAt: updated.castRespondedAt,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		}
	},
}
