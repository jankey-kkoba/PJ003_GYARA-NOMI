'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'

interface LoginSuccessToastProps {
  show: boolean
}

/**
 * ログイン成功時のトースト表示コンポーネント
 * 外部システム（トースト通知、ブラウザURL）との同期を行うためuseEffectを使用
 */
export function LoginSuccessToast({ show }: LoginSuccessToastProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const hasShown = useRef(false)

  useEffect(() => {
    if (show && !hasShown.current) {
      hasShown.current = true
      showToast('ログインに成功しました', 'success')
      // URLからパラメータを削除
      router.replace('/')
    }
  }, [show, showToast, router])

  return null
}
