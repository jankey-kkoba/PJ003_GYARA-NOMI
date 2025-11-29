'use client'

import { Star } from 'lucide-react'
import { cn } from '@/libs/utils'

/**
 * StarRatingのProps
 */
type StarRatingProps = {
	/** 現在の評価値（1-5） */
	value: number
	/** 評価変更時のコールバック */
	onChange: (value: number) => void
	/** 無効化フラグ */
	disabled?: boolean
}

/**
 * 星評価コンポーネント
 */
export function StarRating({
	value,
	onChange,
	disabled = false,
}: StarRatingProps) {
	return (
		<div className="flex gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					onClick={() => !disabled && onChange(star)}
					disabled={disabled}
					className={cn(
						'p-1 transition-colors',
						disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110',
					)}
					aria-label={`${star}星`}
				>
					<Star
						className={cn(
							'h-8 w-8',
							star <= value
								? 'fill-yellow-400 text-yellow-400'
								: 'fill-none text-muted-foreground',
						)}
					/>
				</button>
			))}
		</div>
	)
}
