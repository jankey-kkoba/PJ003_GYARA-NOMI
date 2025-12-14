'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useExtendGroupMatching } from '@/features/group-matching/hooks/useExtendGroupMatching'
import { ConfirmActionDialog } from '@/components/molecules/ConfirmActionDialog'
import { ChevronRight } from 'lucide-react'

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

/**
 * 延長時間の選択肢（30分単位）
 */
const EXTENSION_OPTIONS = [
	{ value: '30', label: '30分' },
	{ value: '60', label: '1時間' },
	{ value: '90', label: '1時間30分' },
	{ value: '120', label: '2時間' },
]

type GroupMatchingStatusCardProps = {
	matching: GuestGroupMatching
}

/**
 * グループマッチング状況カード
 * コンパクト表示でタップするとモーダルで詳細を表示
 */
export function GroupMatchingStatusCard({
	matching,
}: GroupMatchingStatusCardProps) {
	const statusInfo = getStatusInfo(matching.status)
	const { participantSummary } = matching
	const { mutate: extendMatching, isPending: isExtendPending } =
		useExtendGroupMatching()
	const [error, setError] = useState<string | null>(null)
	const [selectedExtension, setSelectedExtension] = useState<string>('30')

	// 詳細モーダルの状態管理
	const [isDetailOpen, setIsDetailOpen] = useState(false)

	// 確認ダイアログの状態管理
	const [dialogOpen, setDialogOpen] = useState(false)

	const openDialog = () => {
		setDialogOpen(true)
	}

	const closeDialog = () => {
		setDialogOpen(false)
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
	// in_progress状態かつ終了予定時刻を過ぎている場合に表示
	const showExtendButton = matching.status === 'in_progress'
	const isScheduledEndPassed =
		matching.scheduledEndAt && new Date() >= new Date(matching.scheduledEndAt)

	// 延長ポイントの計算（参加中のキャスト数 × 時給 × 延長時間）
	// 時給は合計ポイントから逆算（合計ポイント / 時間 / 参加キャスト数）
	const calculateExtensionPoints = () => {
		const joinedCount = participantSummary.joinedCount || 1
		// 時給を逆算: 合計ポイント / (時間/60) / キャスト数
		const hourlyRatePerCast =
			(matching.totalPoints * 60) /
			matching.proposedDuration /
			matching.requestedCastCount
		const extensionMinutes = parseInt(selectedExtension, 10)
		return Math.round((extensionMinutes / 60) * hourlyRatePerCast * joinedCount)
	}

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
							<span className="text-muted-foreground shrink-0">
								{formattedDate}
							</span>
							<span className="truncate">{matching.proposedLocation}</span>
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
								<span>グループ募集</span>
								<Badge variant="outline" className="text-xs">
									{matching.requestedCastCount}人募集
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

							<div>
								<span className="text-muted-foreground">合計:</span>
							</div>
							<div className="text-right font-semibold">
								{matching.totalPoints.toLocaleString()}ポイント
							</div>
						</div>

						{/* 参加者サマリー */}
						<div className="pt-3 border-t">
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
										onClick={openDialog}
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
				</DialogContent>
			</Dialog>

			{/* 延長確認ダイアログ */}
			<ConfirmActionDialog
				open={dialogOpen}
				onOpenChange={(open) => !open && closeDialog()}
				title="グループギャラ飲みを延長しますか？"
				description={`${selectedExtension}分延長します。延長ポイント: ${calculateExtensionPoints().toLocaleString()}ポイント`}
				confirmLabel="延長する"
				onConfirm={handleExtend}
				isPending={isExtendPending}
			/>
		</>
	)
}
