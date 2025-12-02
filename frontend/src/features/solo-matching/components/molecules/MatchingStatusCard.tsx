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
import { useExtendSoloMatching } from '@/features/solo-matching/hooks/useExtendSoloMatching'
import { useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

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
	/** ゲストビューかどうか（延長ボタン表示用） */
	isGuestView?: boolean
}

/**
 * マッチング状況カード
 * 個々のマッチング情報を表示
 */
/**
 * 延長時間の選択肢（30分単位）
 */
const EXTENSION_OPTIONS = [
	{ value: '30', label: '30分' },
	{ value: '60', label: '1時間' },
	{ value: '90', label: '1時間30分' },
	{ value: '120', label: '2時間' },
]

export function MatchingStatusCard({
	matching,
	showActions = false,
	isGuestView = false,
}: MatchingStatusCardProps) {
	const statusInfo = getStatusInfo(matching.status)
	const { mutate: respondToMatching, isPending: isRespondPending } =
		useRespondToSoloMatching()
	const { mutate: startMatching, isPending: isStartPending } =
		useStartSoloMatching()
	const { mutate: completeMatching, isPending: isCompletePending } =
		useCompleteSoloMatching()
	const { mutate: extendMatching, isPending: isExtendPending } =
		useExtendSoloMatching()
	const [error, setError] = useState<string | null>(null)
	const [selectedExtension, setSelectedExtension] = useState<string>('30')

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

	const handleExtend = () => {
		setError(null)
		extendMatching(
			{
				matchingId: matching.id,
				extensionMinutes: parseInt(selectedExtension, 10),
			},
			{
				onError: (err) => {
					setError(
						err instanceof Error
							? err.message
							: 'マッチングの延長に失敗しました',
					)
				},
			},
		)
	}

	// 延長ボタンを表示するかどうかを判定
	// ゲストビューかつin_progress状態かつ終了予定時刻を過ぎている場合に表示
	const showExtendButton = isGuestView && matching.status === 'in_progress'
	const isScheduledEndPassed =
		matching.scheduledEndAt && new Date() >= new Date(matching.scheduledEndAt)

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
			{showExtendButton && isScheduledEndPassed && (
				<CardFooter className="flex flex-col gap-2">
					<div className="flex w-full gap-2">
						<Select
							value={selectedExtension}
							onValueChange={setSelectedExtension}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="延長時間" />
							</SelectTrigger>
							<SelectContent>
								{EXTENSION_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="default"
							className="flex-1"
							onClick={handleExtend}
							disabled={isExtendPending}
						>
							延長する
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						延長ポイント:{' '}
						{Math.round(
							(parseInt(selectedExtension, 10) / 60) *
								((matching.totalPoints * 60) / matching.proposedDuration),
						).toLocaleString()}
						ポイント
					</p>
				</CardFooter>
			)}
		</Card>
	)
}
