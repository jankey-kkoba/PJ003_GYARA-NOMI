'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MatchingOfferForm } from './MatchingOfferForm'
import { useToast } from '@/hooks/useToast'
import { usePendingOffer } from '@/features/solo-matching/hooks/usePendingOffer'
import { useQueryClient } from '@tanstack/react-query'

/**
 * MatchingOfferDialogのProps
 */
type MatchingOfferDialogProps = {
	/** キャストID */
	castId: string
	/** キャスト名（表示用） */
	castName?: string
}

/**
 * マッチングオファー送信ダイアログ
 */
export function MatchingOfferDialog({
	castId,
	castName = 'キャスト',
}: MatchingOfferDialogProps) {
	const [open, setOpen] = useState(false)
	const { showToast } = useToast()
	const queryClient = useQueryClient()
	const { data, isLoading } = usePendingOffer(castId)

	const hasPendingOffer = data?.hasPendingOffer ?? false

	const handleSuccess = () => {
		showToast('マッチングオファーを送信しました', 'success')
		setOpen(false)
		// pendingオファーのキャッシュを無効化して再取得
		queryClient.invalidateQueries({ queryKey: ['pendingOffer', castId] })
	}

	// ローディング中はボタンを無効化
	if (isLoading) {
		return (
			<Button className="w-full" size="lg" disabled>
				読み込み中...
			</Button>
		)
	}

	// 回答待ちのオファーがある場合は「回答待ちです」を表示
	if (hasPendingOffer) {
		return (
			<Button className="w-full" size="lg" variant="secondary" disabled>
				回答待ちです
			</Button>
		)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="w-full" size="lg">
					マッチングオファーを送る
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{castName}へのマッチングオファー</DialogTitle>
					<DialogDescription>
						希望日時、時間、場所を入力してオファーを送信してください。
					</DialogDescription>
				</DialogHeader>
				<MatchingOfferForm castId={castId} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
