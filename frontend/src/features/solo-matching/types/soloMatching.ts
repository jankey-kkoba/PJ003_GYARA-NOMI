/**
 * マッチングステータス
 */
export type MatchingStatus =
	| 'pending' // 回答待ち
	| 'accepted' // 承認
	| 'rejected' // 拒否
	| 'cancelled' // キャンセル
	| 'meeting' // 合流待ち
	| 'in_progress' // 進行中
	| 'completed' // 完了

/**
 * ソロマッチング
 * 時給（hourlyRate）はキャストのランクから動的に計算されるため、型には含めない
 */
export type SoloMatching = {
	id: string
	guestId: string
	castId: string
	chatRoomId: string | null
	status: MatchingStatus
	proposedDate: string
	proposedDuration: number
	proposedLocation: string
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
 * キャスト向けソロマッチング
 * ゲスト情報を含む
 */
export type CastSoloMatching = SoloMatching & {
	/** ゲスト情報 */
	guest: {
		id: string
		nickname: string
	}
}
