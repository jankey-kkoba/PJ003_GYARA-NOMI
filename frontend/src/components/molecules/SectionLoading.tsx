import { Loader2 } from 'lucide-react'
import { cn } from '@/libs/utils'

type SectionLoadingProps = {
  /** ローディングメッセージ */
  message?: string
  /** カスタムクラス名 */
  className?: string
  /** 最小高さ（Tailwind CSS クラス） */
  minHeight?: string
}

/**
 * セクション用のローディング表示コンポーネント
 * セクション内で中央にスピナーとメッセージを表示
 */
export function SectionLoading({
  message = '読み込み中...',
  className,
  minHeight = 'min-h-[400px]',
}: SectionLoadingProps) {
  return (
    <div
      className={cn('flex items-center justify-center', minHeight, className)}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
