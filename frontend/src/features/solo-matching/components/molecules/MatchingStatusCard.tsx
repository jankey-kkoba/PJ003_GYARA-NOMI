'use client'

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
	SoloMatching,
	MatchingStatus,
} from '@/features/solo-matching/types/soloMatching'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useRespondToSoloMatching } from '@/features/solo-matching/hooks/useRespondToSoloMatching'
import { useStartSoloMatching } from '@/features/solo-matching/hooks/useStartSoloMatching'
import { useCompleteSoloMatching } from '@/features/solo-matching/hooks/useCompleteSoloMatching'
import { useState } from 'react'

/**
 * マッチングステータスのラベルと色を取得
 */
function getStatusInfo(status: MatchingStatus): {
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

type MatchingStatusCardProps = {
	matching: SoloMatching
	/** 回答ボタンを表示するか（キャストが回答待ちのマッチングの場合のみtrue） */
	showActions?: boolean
}

/**
 * マッチング状況カード
 * 個々のマッチング情報を表示
 */
export function MatchingStatusCard({
	matching,
	showActions = false,
}: MatchingStatusCardProps) {
	const statusInfo = getStatusInfo(matching.status)
	const { mutate: respondToMatching, isPending: isRespondPending } =
		useRespondToSoloMatching()
	const { mutate: startMatching, isPending: isStartPending } =
		useStartSoloMatching()
	const { mutate: completeMatching, isPending: isCompletePending } =
		useCompleteSoloMatching()
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

	const handleComplete = () => {
		setError(null)
		completeMatching(
			{ matchingId: matching.id },
			{
				onError: (err) => {
					setError(
						err instanceof Error
							? err.message
							: 'マッチングの終了に失敗しました',
					)
				},
			},
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">
						マッチングID: {matching.id.slice(0, 8)}
					</CardTitle>
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
				{error && <div className="mt-2 text-sm text-destructive">{error}</div>}
			</CardContent>
			{showActions && matching.status === 'pending' && (
				<CardFooter className="flex gap-2">
					<Button
						variant="default"
						className="flex-1"
						onClick={() => handleRespond('accepted')}
						disabled={isRespondPending}
					>
						承認
					</Button>
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => handleRespond('rejected')}
						disabled={isRespondPending}
					>
						拒否
					</Button>
				</CardFooter>
			)}
			{showActions && matching.status === 'accepted' && (
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
			{showActions && matching.status === 'in_progress' && (
				<CardFooter>
					<Button
						variant="destructive"
						className="w-full"
						onClick={handleComplete}
						disabled={isCompletePending}
					>
						終了
					</Button>
				</CardFooter>
			)}
		</Card>
	)
}
