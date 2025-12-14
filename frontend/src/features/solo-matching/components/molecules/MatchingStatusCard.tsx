'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import type {
	SoloMatching,
	CastSoloMatching,
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
import { ConfirmActionDialog } from '@/components/molecules/ConfirmActionDialog'
import { ChevronRight } from 'lucide-react'

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
	matching: SoloMatching | CastSoloMatching
	/** 回答ボタンを表示するか（キャストが回答待ちのマッチングの場合のみtrue） */
	showActions?: boolean
	/** ゲストビューかどうか（延長ボタン表示用） */
	isGuestView?: boolean
}

/**
 * 延長時間の選択肢（30分単位）
 */
const EXTENSION_OPTIONS = [
	{ value: '30', label: '30分' },
	{ value: '60', label: '1時間' },
	{ value: '90', label: '1時間30分' },
	{ value: '120', label: '2時間' },
]

/**
 * CastSoloMatchingかどうかを判定する型ガード
 */
function isCastSoloMatching(
	matching: SoloMatching | CastSoloMatching,
): matching is CastSoloMatching {
	return 'guest' in matching
}

/**
 * マッチング状況カード
 * コンパクト表示でタップするとモーダルで詳細を表示
 */
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

	// 詳細モーダルの状態管理
	const [isDetailOpen, setIsDetailOpen] = useState(false)

	// 確認ダイアログの状態管理
	const [dialogState, setDialogState] = useState<{
		type: 'accept' | 'reject' | 'start' | 'complete' | 'extend' | null
		open: boolean
	}>({ type: null, open: false })

	const openDialog = (
		type: 'accept' | 'reject' | 'start' | 'complete' | 'extend',
	) => {
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

	const handleExtend = () => {
		setError(null)
		extendMatching(
			{
				matchingId: matching.id,
				extensionMinutes: parseInt(selectedExtension, 10),
			},
			{
				onSuccess: () => {
					closeDialog()
					setIsDetailOpen(false)
				},
				onError: (err) => {
					setError(
						err instanceof Error
							? err.message
							: 'マッチングの延長に失敗しました',
					)
					closeDialog()
				},
			},
		)
	}

	// 延長ボタンを表示するかどうかを判定
	// ゲストビューかつin_progress状態かつ終了予定時刻を過ぎている場合に表示
	const showExtendButton = isGuestView && matching.status === 'in_progress'
	const isScheduledEndPassed =
		matching.scheduledEndAt && new Date() >= new Date(matching.scheduledEndAt)

	// ゲスト情報（CastSoloMatchingの場合のみ）
	const guestInfo = isCastSoloMatching(matching) ? matching.guest : null

	// ダイアログに表示するゲスト情報コンテンツ
	const guestInfoContent = guestInfo && (
		<div className="rounded-md bg-muted p-3">
			<div className="text-sm font-medium">ゲスト情報</div>
			<div className="mt-1 text-sm text-muted-foreground">
				{guestInfo.nickname}さん
			</div>
		</div>
	)

	// 延長ポイントの計算
	const calculateExtensionPoints = () => {
		const extensionMinutes = parseInt(selectedExtension, 10)
		return Math.round(
			(extensionMinutes / 60) *
				((matching.totalPoints * 60) / matching.proposedDuration),
		)
	}

	// コンパクトカードに表示するタイトル
	const cardTitle = guestInfo ? `${guestInfo.nickname}さん` : `ソロマッチング`

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
						<span className="text-sm font-medium truncate">{cardTitle}</span>
					</div>
					<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
				</div>
			</button>

			{/* 詳細モーダル */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{guestInfo ? (
								<span>{guestInfo.nickname}さんからのオファー</span>
							) : (
								<span>ソロマッチング</span>
							)}
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

							<div>
								<span className="text-muted-foreground">合計:</span>
							</div>
							<div className="text-right font-semibold">
								{matching.totalPoints.toLocaleString()}ポイント
							</div>
						</div>

						{/* エラー表示 */}
						{error && <div className="text-sm text-destructive">{error}</div>}

						{/* 延長UI */}
						{showExtendButton && isScheduledEndPassed && (
							<div className="pt-3 border-t space-y-2">
								<div className="flex gap-2">
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
										onClick={() => openDialog('extend')}
										disabled={isExtendPending}
									>
										延長する
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									延長ポイント: {calculateExtensionPoints().toLocaleString()}
									ポイント
								</p>
							</div>
						)}
					</div>

					{/* アクションボタン */}
					{showActions && (
						<DialogFooter className="mt-4">
							{matching.status === 'pending' && (
								<div className="flex gap-2 w-full">
									<Button
										variant="default"
										className="flex-1"
										onClick={() => openDialog('accept')}
										disabled={isRespondPending}
									>
										承認
									</Button>
									<Button
										variant="outline"
										className="flex-1"
										onClick={() => openDialog('reject')}
										disabled={isRespondPending}
									>
										拒否
									</Button>
								</div>
							)}
							{matching.status === 'accepted' && (
								<Button
									variant="default"
									className="w-full"
									onClick={() => openDialog('start')}
									disabled={isStartPending}
								>
									合流
								</Button>
							)}
							{matching.status === 'in_progress' && (
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
					)}
				</DialogContent>
			</Dialog>

			{/* 承認確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'accept' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="オファーを承認しますか？"
				description="このオファーを承認すると、ゲストとのギャラ飲みが成立します。"
				confirmLabel="承認する"
				onConfirm={() => handleRespond('accepted')}
				isPending={isRespondPending}
			>
				{guestInfoContent}
			</ConfirmActionDialog>

			{/* 拒否確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'reject' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="オファーを拒否しますか？"
				description="このオファーを拒否すると、マッチングは不成立となります。"
				confirmLabel="拒否する"
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
				description="合流ボタンを押すと、ギャラ飲みが開始されます。"
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
				description="終了ボタンを押すと、このギャラ飲みは完了となります。"
				confirmLabel="終了する"
				variant="destructive"
				onConfirm={handleComplete}
				isPending={isCompletePending}
			>
				{guestInfoContent}
			</ConfirmActionDialog>

			{/* 延長確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogState.type === 'extend' && dialogState.open}
				onOpenChange={(open) => !open && closeDialog()}
				title="ギャラ飲みを延長しますか？"
				description={`${selectedExtension}分延長します。延長ポイント: ${calculateExtensionPoints().toLocaleString()}ポイント`}
				confirmLabel="延長する"
				onConfirm={handleExtend}
				isPending={isExtendPending}
			/>
		</>
	)
}
