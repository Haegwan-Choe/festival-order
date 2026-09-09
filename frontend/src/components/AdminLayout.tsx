import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminHeader } from '@/components/AdminHeader'
import { AdminSidebar } from '@/components/AdminSidebar'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <AdminHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="space-y-6 p-6">
        <Outlet />
      </main>
    </div>
  )
}
