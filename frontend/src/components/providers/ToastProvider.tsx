'use client'

import { createContext, useCallback, useState, type ReactNode } from 'react'
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
} from '@/libs/radix-ui/toast'
import { Toast, type ToastType } from '@/components/atoms/Toast'

interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  /**
   * トーストを表示する
   */
  showToast: (message: string, type?: ToastType, duration?: number) => void
  /**
   * タイトル付きトーストを表示する
   */
  showToastWithTitle: (
    title: string,
    message: string,
    type?: ToastType,
    duration?: number
  ) => void
  /**
   * トーストを非表示にする
   */
  hideToast: (id: string) => void
  /**
   * すべてのトーストを非表示にする
   */
  hideAllToasts: () => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

interface ToastProviderProps {
  children: ReactNode
}

/**
 * トースト通知を管理するProvider
 * Radix UIをベースにアプリケーション全体でトーストを表示・非表示できるようにする
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    []
  )

  const showToastWithTitle = useCallback(
    (
      title: string,
      message: string,
      type: ToastType = 'info',
      duration?: number
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      setToasts((prev) => [...prev, { id, title, message, type, duration }])
    },
    []
  )

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const hideAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider
      value={{ showToast, showToastWithTitle, hideToast, hideAllToasts }}
    >
      <RadixToastProvider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                hideToast(toast.id)
              }
            }}
          />
        ))}
        <ToastViewport className="fixed bottom-4 right-4 z-50 flex max-w-[100vw] flex-col gap-2 p-4 outline-none" />
      </RadixToastProvider>
    </ToastContext.Provider>
  )
}
