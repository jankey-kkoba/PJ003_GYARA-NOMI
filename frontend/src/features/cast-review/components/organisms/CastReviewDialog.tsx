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
import { CastReviewForm } from './CastReviewForm'
import { useToast } from '@/hooks/useToast'
import { useCastReview } from '@/features/cast-review/hooks/useCastReview'
import { Star, CheckCircle } from 'lucide-react'

/**
 * CastReviewDialogのProps
 */
type CastReviewDialogProps = {
	/** マッチングID */
	matchingId: string
	/** キャスト名（表示用） */
	castName?: string
}

/**
 * キャスト評価ダイアログ
 */
export function CastReviewDialog({
	matchingId,
	castName = 'キャスト',
}: CastReviewDialogProps) {
	const [open, setOpen] = useState(false)
	const { showToast } = useToast()
	const { data: review, isLoading } = useCastReview(matchingId)

	const handleSuccess = () => {
		showToast('評価を送信しました', 'success')
		setOpen(false)
	}

	// ローディング中
	if (isLoading) {
		return (
			<Button variant="outline" size="sm" disabled>
				読み込み中...
			</Button>
		)
	}

	// 既に評価済みの場合
	if (review) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CheckCircle className="h-4 w-4 text-green-500" />
				<span>評価済み</span>
				<div className="flex items-center gap-0.5">
					{[1, 2, 3, 4, 5].map((star) => (
						<Star
							key={star}
							className={`h-3 w-3 ${
								star <= review.rating
									? 'fill-yellow-400 text-yellow-400'
									: 'fill-none text-muted-foreground'
							}`}
						/>
					))}
				</div>
			</div>
		)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Star className="mr-1 h-4 w-4" />
					評価する
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{castName}の評価</DialogTitle>
					<DialogDescription>
						今回のギャラ飲みの感想をお聞かせください。
					</DialogDescription>
				</DialogHeader>
				<CastReviewForm matchingId={matchingId} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
