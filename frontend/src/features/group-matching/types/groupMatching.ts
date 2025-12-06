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
	respondedAt: string | null
	joinedAt: string | null
	createdAt: string
	updatedAt: string
}

/**
 * グループマッチング作成結果の型定義
 * 条件に合うキャストが0人の場合は matching: null, participantCount: 0 を返す
 */
export type CreateGroupMatchingResult = {
	matching: GroupMatching | null
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

/**
 * キャスト向けグループマッチング一覧用の型定義
 * ゲスト情報とマッチングステータスを含む
 */
export type CastGroupMatching = GroupMatching & {
	/** マッチングのタイプ（UI表示用） */
	type: 'group'
	/** このキャストの参加ステータス */
	participantStatus:
		| 'pending'
		| 'accepted'
		| 'rejected'
		| 'joined'
		| 'completed'
	/** ゲスト情報 */
	guest: {
		id: string
		nickname: string
	}
	/** 参加者のサマリー情報 */
	participantSummary: {
		/** 希望人数 */
		requestedCount: number
		/** 承認済み人数 */
		acceptedCount: number
		/** 合流済み人数 */
		joinedCount: number
	}
}
