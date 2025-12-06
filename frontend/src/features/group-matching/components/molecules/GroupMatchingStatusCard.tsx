'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * マッチングステータスのラベルと色を取得
 */
function getStatusInfo(status: GuestGroupMatching['status']): {
	label: string
	variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
	switch (status) {
		case 'pending':
			return { label: '回答待ち', variant: 'default' }
		case 'accepted':
			return { label: '成立', variant: 'default' }
		case 'rejected':
			return { label: '不成立', variant: 'destructive' }
		case 'cancelled':
			return { label: 'キャンセル', variant: 'destructive' }
		case 'meeting':
			return { label: '合流待ち', variant: 'default' }
		case 'in_progress':
			return { label: 'ギャラ飲み中', variant: 'default' }
		case 'completed':
			return { label: '完了', variant: 'secondary' }
		default:
			return { label: status, variant: 'outline' }
	}
}

type GroupMatchingStatusCardProps = {
	matching: GuestGroupMatching
}

/**
 * グループマッチング状況カード
 * ゲスト向けにグループマッチングの情報を表示
 */
export function GroupMatchingStatusCard({
	matching,
}: GroupMatchingStatusCardProps) {
	const statusInfo = getStatusInfo(matching.status)
	const { participantSummary } = matching

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle className="text-base">グループ募集</CardTitle>
						<Badge variant="outline" className="text-xs">
							{matching.requestedCastCount}人募集
						</Badge>
					</div>
					<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div>
						<span className="text-muted-foreground">希望日時:</span>
					</div>
					<div className="text-right">
						{format(new Date(matching.proposedDate), 'M月d日(E) HH:mm', {
							locale: ja,
						})}
					</div>

					<div>
						<span className="text-muted-foreground">時間:</span>
					</div>
					<div className="text-right">{matching.proposedDuration}分</div>

					<div>
						<span className="text-muted-foreground">場所:</span>
					</div>
					<div className="text-right truncate">{matching.proposedLocation}</div>

					<div>
						<span className="text-muted-foreground">合計:</span>
					</div>
					<div className="text-right font-semibold">
						{matching.totalPoints.toLocaleString()}ポイント
					</div>
				</div>

				{/* 参加者サマリー */}
				<div className="mt-3 pt-3 border-t">
					<div className="text-sm text-muted-foreground mb-2">応募状況</div>
					<div className="flex gap-2 flex-wrap text-xs">
						{participantSummary.pendingCount > 0 && (
							<Badge variant="outline">
								回答待ち: {participantSummary.pendingCount}人
							</Badge>
						)}
						{participantSummary.acceptedCount > 0 && (
							<Badge variant="default">
								承認: {participantSummary.acceptedCount}人
							</Badge>
						)}
						{participantSummary.rejectedCount > 0 && (
							<Badge variant="destructive">
								拒否: {participantSummary.rejectedCount}人
							</Badge>
						)}
						{participantSummary.joinedCount > 0 && (
							<Badge variant="default">
								合流済み: {participantSummary.joinedCount}人
							</Badge>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
