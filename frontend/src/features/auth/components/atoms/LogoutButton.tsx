'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface LogoutButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
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
