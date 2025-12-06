/**
 * グループマッチングの型定義
 */
export type GroupMatching = {
	id: string
	guestId: string
	chatRoomId: string | null
	status:
		| 'pending'
		| 'accepted'
		| 'rejected'
		| 'cancelled'
		| 'meeting'
		| 'in_progress'
		| 'completed'
	proposedDate: Date
	proposedDuration: number
	proposedLocation: string
	requestedCastCount: number
	totalPoints: number
	startedAt: Date | null
	scheduledEndAt: Date | null
	actualEndAt: Date | null
	extensionMinutes: number
	extensionPoints: number
	recruitingEndedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

/**
 * グループマッチング参加者の型定義
 */
export type GroupMatchingParticipant = {
	id: string
	matchingId: string
	castId: string
	castName: string
	status: 'pending' | 'accepted' | 'rejected' | 'joined' | 'completed'
	respondedAt: Date | null
	joinedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

/**
 * グループマッチング作成結果の型定義
 */
export type CreateGroupMatchingResult = {
	matching: GroupMatching
	participantCount: number
}

/**
 * ゲスト向けグループマッチング一覧用の型定義
 * 参加者のサマリー情報を含む
 */
export type GuestGroupMatching = GroupMatching & {
	/** マッチングのタイプ（UI表示用） */
	type: 'group'
	/** 参加者のサマリー情報 */
	participantSummary: {
		/** 回答待ち人数 */
		pendingCount: number
		/** 承認済み人数 */
		acceptedCount: number
		/** 拒否人数 */
		rejectedCount: number
		/** 合流済み人数 */
		joinedCount: number
	}
}
