import { Menu, Search, Bell } from 'lucide-react'
import { AddApplicationModal } from '@/features/kanban/AddApplicationModal'

interface TopbarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (c: boolean) => void
}

export function Topbar({ sidebarCollapsed, setSidebarCollapsed }: TopbarProps) {
  return (
    <header className="h-[60px] sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-6 gap-4">
      <button 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden md:flex w-9 h-9 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search jobs, companies, notes..." 
          className="w-full h-9 pl-9 pr-12 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all placeholder:text-slate-400 dark:text-slate-200"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
        <AddApplicationModal />
      </div>
    </header>
  )
}
