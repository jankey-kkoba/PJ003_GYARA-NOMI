'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useRespondToGroupMatching } from '@/features/group-matching/hooks/useRespondToGroupMatching'
import { useStartGroupMatching } from '@/features/group-matching/hooks/useStartGroupMatching'
import { useCompleteGroupMatching } from '@/features/group-matching/hooks/useCompleteGroupMatching'
import { ConfirmActionDialog } from '@/components/molecules/ConfirmActionDialog'
import { ChevronRight } from 'lucide-react'

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
 * コンパクト表示でタップするとモーダルで詳細を表示
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
	const { mutate: completeMatching, isPending: isCompletePending } =
		useCompleteGroupMatching()
	const [error, setError] = useState<string | null>(null)

	// 詳細モーダルの状態管理
	const [isDetailOpen, setIsDetailOpen] = useState(false)

	// 確認ダイアログの状態管理
	const [dialogState, setDialogState] = useState<{
		type: 'accept' | 'reject' | 'start' | 'complete' | null
		open: boolean
	}>({ type: null, open: false })

	const openDialog = (type: 'accept' | 'reject' | 'start' | 'complete') => {
		setDialogState({ type, open: true })
	}

	const closeDialog = () => {
		setDialogState({ type: null, open: false })
	}

	const handleRespond = (response: 'accepted' | 'rejected') => {
		setError(null)
		respondToMatching(
			{ matchingId: matching.id, response },
			{
				onSuccess: () => {
					closeDialog()
					setIsDetailOpen(false)
				},
				onError: (err) => {
					setError(err instanceof Error ? err.message : '回答に失敗しました')
					closeDialog()
				},
			},
		)
	}

	const handleStart = () => {
		setError(null)
		startMatching(
			{ matchingId: matching.id },
			{
				onSuccess: () => {
					closeDialog()
					setIsDetailOpen(false)
				},
				onError: (err) => {
					setError(
						err instanceof Error
							? err.message
							: 'マッチングの開始に失敗しました',
					)
					closeDialog()
				},
			},
		)
	}

	const handleComplete = () => {
		setError(null)
		completeMatching(
			{ matchingId: matching.id },
			{
				onSuccess: () => {
					closeDialog()
					setIsDetailOpen(false)
				},
				onError: (err) => {
					setError(
						err instanceof Error
							? err.message
							: 'マッチングの終了に失敗しました',
					)
					closeDialog()
				},
			},
		)
	}

	// ゲスト情報コンテンツ（ダイアログ表示用）
	const guestInfoContent = (
		<div className="rounded-md bg-muted p-3">
			<div className="text-sm font-medium">ゲスト情報</div>
			<div className="mt-1 text-sm text-muted-foreground">
				{matching.guest.nickname}さん
			</div>
		</div>
	)

	// 回答ボタンを表示するかどうか（pending状態かつマッチング全体も募集中の場合）
	const showResponseButtons =
		matching.participantStatus === 'pending' && matching.status === 'pending'

	// 合流ボタンを表示するかどうか（参加者がaccepted状態かつマッチングがacceptedの場合）
	const showStartButton =
		matching.participantStatus === 'accepted' && matching.status === 'accepted'

	// 終了ボタンを表示するかどうか（参加者がjoined状態かつマッチングがin_progressの場合）
	const showCompleteButton =
		matching.participantStatus === 'joined' && matching.status === 'in_progress'

	// コンパクト表示用の日時フォーマット
	const formattedDate = format(new Date(matching.proposedDate), 'M/d HH:mm', {
		locale: ja,
	})

	return (
		<>
			{/* コンパクト表示カード */}
			<button
				type="button"
				onClick={() => setIsDetailOpen(true)}
				className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3 min-w-0">
						<Badge variant={statusInfo.variant} className="shrink-0">
							{statusInfo.label}
						</Badge>
						<div className="flex items-center gap-2 text-sm min-w-0">
							<span className="font-medium shrink-0">
								{matching.guest.nickname}さん
							</span>
							<span className="text-muted-foreground shrink-0">
								{formattedDate}
							</span>
						</div>
					</div>
					<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
				</div>
			</button>

			{/* 詳細モーダル */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<div className="flex items-center gap-2">
								<span>グループオファー</span>
								<Badge variant="outline" className="text-xs">
									{matching.guest.nickname}さん
								</Badge>
							</div>
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* ステータス */}
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">ステータス:</span>
							<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
						</div>

						{/* 詳細情報 */}
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
							<div className="text-right truncate">
								{matching.proposedLocation}
							</div>
						</div>

						{/* 参加者サマリー */}
						<div className="pt-3 border-t">
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

						{/* エラー表示 */}
						{error && <div className="text-sm text-destructive">{error}</div>}
					</div>

					{/* アクションボタン */}
					<DialogFooter className="mt-4">
						{showResponseButtons && (
							<div className="flex gap-2 w-full">
								<Button
									variant="default"
									className="flex-1"
									onClick={() => openDialog('accept')}
									disabled={isRespondPending}
								>
									参加する
								</Button>
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => openDialog('reject')}
									disabled={isRespondPending}
								>
									辞退する
								</Button>
							</div>
						)}
						{showStartButton && (
							<Button
								variant="default"
								className="w-full"
								onClick={() => openDialog('start')}
								disabled={isStartPending}
							>
								合流
							</Button>
						)}
						{showCompleteButton && (
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => openDialog('complete')}
								disabled={isCompletePending}
							>
								終了
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 参加確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'accept' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="グループオファーに参加しますか？"
				description="このオファーに参加すると、ゲストとのグループギャラ飲みに参加予定となります。"
				confirmLabel="参加する"
				onConfirm={() => handleRespond('accepted')}
				isPending={isRespondPending}
			>
				{guestInfoContent}
			</ConfirmActionDialog>

			{/* 辞退確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'reject' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="グループオファーを辞退しますか？"
				description="このオファーを辞退すると、このグループギャラ飲みには参加できません。"
				confirmLabel="辞退する"
				variant="destructive"
				onConfirm={() => handleRespond('rejected')}
				isPending={isRespondPending}
			>
				{guestInfoContent}
			</ConfirmActionDialog>

			{/* 合流確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'start' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="ゲストと合流しましたか？"
				description="合流ボタンを押すと、グループギャラ飲みに参加中となります。"
				confirmLabel="合流した"
				onConfirm={handleStart}
				isPending={isStartPending}
			>
				{guestInfoContent}
			</ConfirmActionDialog>

			{/* 終了確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'complete' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="ギャラ飲みを終了しますか？"
				description="終了ボタンを押すと、あなたのギャラ飲みは完了となります。"
				confirmLabel="終了する"
				variant="destructive"
				onConfirm={handleComplete}
				isPending={isCompletePending}
			>
				{guestInfoContent}
			</ConfirmActionDialog>
		</>
	)
}
