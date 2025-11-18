'use client'

import { Button } from '@/components/atoms/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

/**
 * ログアウトボタン
 */
export function LogoutButton({ variant = 'outline' }: LogoutButtonProps) {
  const { logout } = useAuth()

  return (
    <Button onClick={logout} variant={variant}>
      ログアウト
    </Button>
  )
}
