'use client'

import { useContext } from 'react'
import { ToastContext } from '@/components/providers/ToastProvider'

/**
 * トースト通知を操作するためのカスタムフック
 * どのコンポーネントからでもトーストの表示・非表示が可能
 *
 * @example
 * const { showToast, showToastWithTitle, hideToast, hideAllToasts } = useToast()
 *
 * // 成功トーストを表示
 * showToast('ログインに成功しました', 'success')
 *
 * // エラートーストを表示
 * showToast('エラーが発生しました', 'error')
 *
 * // タイトル付きトーストを表示
 * showToastWithTitle('成功', 'ログインに成功しました', 'success')
 *
 * // カスタム表示時間を指定（10秒）
 * showToast('長めに表示します', 'info', 10000)
 */
export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
