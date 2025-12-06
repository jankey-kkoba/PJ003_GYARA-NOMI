'use client'

import type { ReactNode } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmActionDialogProps = {
	/** ダイアログの開閉状態 */
	open: boolean
	/** ダイアログを閉じる際のコールバック */
	onOpenChange: (open: boolean) => void
	/** ダイアログのタイトル */
	title: string
	/** ダイアログの説明文 */
	description?: string
	/** 追加コンテンツ（ゲスト情報など） */
	children?: ReactNode
	/** 確認ボタンのラベル */
	confirmLabel?: string
	/** キャンセルボタンのラベル */
	cancelLabel?: string
	/** 確認ボタンのバリアント（destructiveの場合は赤色） */
	variant?: 'default' | 'destructive'
	/** 確認ボタン押下時のコールバック */
	onConfirm: () => void
	/** 処理中かどうか */
	isPending?: boolean
}

/**
 * 確認ダイアログ
 * アクション実行前にユーザーに確認を促す共通コンポーネント
 */
export function ConfirmActionDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	confirmLabel = '確認',
	cancelLabel = 'キャンセル',
	variant = 'default',
	onConfirm,
	isPending = false,
}: ConfirmActionDialogProps) {
	const handleConfirm = () => {
		onConfirm()
		// isPending が false になったら自動的に閉じるのではなく、
		// 呼び出し側で onOpenChange(false) を呼ぶことで閉じる
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && (
						<AlertDialogDescription>{description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				{children && <div className="py-2">{children}</div>}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>
						{cancelLabel}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isPending}
						className={
							variant === 'destructive'
								? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
								: ''
						}
					>
						{isPending ? '処理中...' : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
