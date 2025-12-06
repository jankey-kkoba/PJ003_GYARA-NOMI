'use client'

import { useState } from 'react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useRespondToGroupMatching } from '@/features/group-matching/hooks/useRespondToGroupMatching'
import { useStartGroupMatching } from '@/features/group-matching/hooks/useStartGroupMatching'

/**
 * キャストの参加ステータスのラベルと色を取得
 */
function getParticipantStatusInfo(
	status: CastGroupMatching['participantStatus'],
): {
	label: string
	variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
	switch (status) {
		case 'pending':
			return { label: '回答待ち', variant: 'default' }
		case 'accepted':
			return { label: '参加予定', variant: 'default' }
		case 'rejected':
			return { label: '辞退', variant: 'destructive' }
		case 'joined':
			return { label: '参加中', variant: 'default' }
		case 'completed':
			return { label: '完了', variant: 'secondary' }
		default:
			return { label: status, variant: 'outline' }
	}
}

type CastGroupMatchingStatusCardProps = {
	matching: CastGroupMatching
}

/**
 * キャスト向けグループマッチング状況カード
 * キャストが参加しているグループマッチングの情報を表示
 */
export function CastGroupMatchingStatusCard({
	matching,
}: CastGroupMatchingStatusCardProps) {
	const statusInfo = getParticipantStatusInfo(matching.participantStatus)
	const { participantSummary } = matching
	const { mutate: respondToMatching, isPending: isRespondPending } =
		useRespondToGroupMatching()
	const { mutate: startMatching, isPending: isStartPending } =
		useStartGroupMatching()
	const [error, setError] = useState<string | null>(null)

	const handleRespond = (response: 'accepted' | 'rejected') => {
		setError(null)
		respondToMatching(
			{ matchingId: matching.id, response },
			{
				onError: (err) => {
					setError(err instanceof Error ? err.message : '回答に失敗しました')
				},
			},
		)
	}

	const handleStart = () => {
		setError(null)
		startMatching(
			{ matchingId: matching.id },
			{
				onError: (err) => {
					setError(
						err instanceof Error
							? err.message
							: 'マッチングの開始に失敗しました',
					)
				},
			},
		)
	}

	// 回答ボタンを表示するかどうか（pending状態かつマッチング全体も募集中の場合）
	const showResponseButtons =
		matching.participantStatus === 'pending' && matching.status === 'pending'

	// 合流ボタンを表示するかどうか（参加者がaccepted状態かつマッチングがacceptedの場合）
	const showStartButton =
		matching.participantStatus === 'accepted' && matching.status === 'accepted'

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle className="text-base">グループオファー</CardTitle>
						<Badge variant="outline" className="text-xs">
							{matching.guest.nickname}さん
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
				</div>

				{/* 参加者サマリー */}
				<div className="mt-3 pt-3 border-t">
					<div className="text-sm text-muted-foreground mb-2">募集状況</div>
					<div className="flex gap-2 flex-wrap text-xs">
						<Badge variant="outline">
							募集: {participantSummary.requestedCount}人
						</Badge>
						{participantSummary.acceptedCount > 0 && (
							<Badge variant="default">
								参加予定: {participantSummary.acceptedCount}人
							</Badge>
						)}
						{participantSummary.joinedCount > 0 && (
							<Badge variant="default">
								合流済み: {participantSummary.joinedCount}人
							</Badge>
						)}
					</div>
				</div>
				{error && <div className="mt-2 text-sm text-destructive">{error}</div>}
			</CardContent>
			{showResponseButtons && (
				<CardFooter className="flex gap-2">
					<Button
						variant="default"
						className="flex-1"
						onClick={() => handleRespond('accepted')}
						disabled={isRespondPending}
					>
						参加する
					</Button>
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => handleRespond('rejected')}
						disabled={isRespondPending}
					>
						辞退する
					</Button>
				</CardFooter>
			)}
			{showStartButton && (
				<CardFooter>
					<Button
						variant="default"
						className="w-full"
						onClick={handleStart}
						disabled={isStartPending}
					>
						合流
					</Button>
				</CardFooter>
			)}
		</Card>
	)
}
