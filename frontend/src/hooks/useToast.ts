import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * トースト通知を操作するためのカスタムフック
 * sonnerをラップし、どのコンポーネントからでもトースト表示が可能
 *
 * @example
 * const { showToast } = useToast()
 *
 * // 成功トーストを表示
 * showToast('ログインに成功しました', 'success')
 *
 * // エラートーストを表示
 * showToast('エラーが発生しました', 'error')
 *
 * // カスタム表示時間を指定（10秒）
 * showToast('長めに表示します', 'info', 10000)
 */
export function useToast() {
  /**
   * トーストを表示する
   */
  const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
    console.log(`Showing toast: [${type}] ${message}`)
    const options = duration ? { duration } : undefined

    switch (type) {
      case 'success':
        toast.success(message, options)
        break
      case 'error':
        toast.error(message, options)
        break
      case 'warning':
        toast.warning(message, options)
        break
      case 'info':
      default:
        toast.info(message, options)
        break
    }
  }

  /**
   * すべてのトーストを非表示にする
   */
  const hideAllToasts = () => {
    toast.dismiss()
  }

  return {
    showToast,
    hideAllToasts,
    // sonnerの元のtoast関数も公開（高度な使用のため）
    toast,
  }
}
