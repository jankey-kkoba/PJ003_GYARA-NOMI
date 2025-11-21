'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface LogoutButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  className?: string
}

/**
 * ログアウトボタン
 */
export function LogoutButton({
  variant = 'outline',
  className,
}: LogoutButtonProps) {
  const { logout } = useAuth()

  return (
    <Button onClick={logout} variant={variant} className={className}>
      ログアウト
    </Button>
  )
}
