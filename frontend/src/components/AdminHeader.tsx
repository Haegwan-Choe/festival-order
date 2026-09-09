import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav'
import { supabase } from '@/lib/supabaseClient'

interface AdminHeaderProps {
  onToggleSidebar: () => void
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { displayName } = useAuth()
  const location = useLocation()
  const title = ADMIN_NAV_ITEMS.find((item) => item.path === location.pathname)?.label ?? '관리자'

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={onToggleSidebar} aria-label="메뉴 열기">
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{displayName}</span>
        <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>
          로그아웃
        </Button>
      </div>
    </div>
  )
}
