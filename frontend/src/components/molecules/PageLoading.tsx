import { Loader2 } from 'lucide-react'
import { cn } from '@/libs/utils'

type PageLoadingProps = {
	/** ローディングメッセージ */
	message?: string
	/** カスタムクラス名 */
	className?: string
}

/**
 * ページ全体のローディング表示コンポーネント
 * 画面中央にスピナーとメッセージを表示
 */
export function PageLoading({
	message = '読み込み中...',
	className,
}: PageLoadingProps) {
	return (
		<div
			className={cn('flex min-h-screen items-center justify-center', className)}
		>
			<div className="flex flex-col items-center gap-4">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground">{message}</p>
			</div>
		</div>
	)
}
