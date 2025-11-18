'use client'

import {
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/libs/radix-ui/toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  title?: string
  message: string
  type?: ToastType
  open: boolean
  onOpenChange: (open: boolean) => void
  duration?: number
}

/**
 * トースト通知コンポーネント
 * Radix UIをラップしたコンポーネント
 * 閉じるボタン付きの通知を表示する
 */
export function Toast({
  title,
  message,
  type = 'info',
  open,
  onOpenChange,
  duration,
}: ToastProps) {
  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white',
  }

  return (
    <ToastRoot
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg data-[state=closed]:animate-fade-out data-[state=open]:animate-slide-in ${typeStyles[type]}`}
    >
      <div className="flex flex-col gap-1">
        {title && (
          <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>
        )}
        <ToastDescription className="text-sm">{message}</ToastDescription>
      </div>
      <ToastClose
        className="ml-2 rounded-full p-1 hover:bg-black/10 focus:outline-none"
        aria-label="閉じる"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </ToastClose>
    </ToastRoot>
  )
}
