'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	useFavoriteStatus,
	useAddFavorite,
	useRemoveFavorite,
} from '@/features/favorite/hooks/useFavorite'
import { cn } from '@/utils/cn'

type FavoriteButtonProps = {
	castId: string
	className?: string
}

/**
 * お気に入りボタンコンポーネント
 * ハートマークでお気に入り状態を表示・切り替え
 */
export function FavoriteButton({ castId, className }: FavoriteButtonProps) {
	const { data: isFavorite, isLoading } = useFavoriteStatus(castId)
	const addFavorite = useAddFavorite()
	const removeFavorite = useRemoveFavorite()

	const isPending = addFavorite.isPending || removeFavorite.isPending

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (isPending) return

		if (isFavorite) {
			removeFavorite.mutate(castId)
		} else {
			addFavorite.mutate(castId)
		}
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={handleClick}
			disabled={isLoading || isPending}
			className={cn('rounded-full', className)}
			aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
		>
			<Heart
				className={cn(
					'h-5 w-5 transition-colors',
					isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
				)}
			/>
		</Button>
	)
}
