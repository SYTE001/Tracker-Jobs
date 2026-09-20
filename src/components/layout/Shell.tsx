import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '@/lib/utils'
import { useJobStore } from '@/store/useJobStore'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const theme = useJobStore(state => state.meta.theme)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-200",
          sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"
        )}
      >
        <Topbar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
