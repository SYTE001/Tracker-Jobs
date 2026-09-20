import { LayoutDashboard, List, BarChart2, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const items = [
    { icon: LayoutDashboard, label: 'Kanban Board', active: true },
    { icon: List, label: 'List View', active: false },
    { icon: BarChart2, label: 'Metrics', active: false },
    { icon: Briefcase, label: 'Companies', active: false },
  ]

  return (
    <aside className={cn(
      "fixed top-0 left-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-all duration-200 flex flex-col",
      collapsed ? "w-[68px] items-center px-2 py-4" : "w-[240px] px-3 py-4"
    )}>
      <div className={cn("flex items-center text-slate-900 dark:text-slate-50 mb-6", collapsed ? "justify-center" : "gap-3 px-2")}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
          JT
        </div>
        {!collapsed && (
          <>
            <span className="font-bold text-[17px] tracking-tight">JobTrack</span>
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">PRO</span>
          </>
        )}
      </div>

      {!collapsed && <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Menu</div>}
      
      <nav className="flex flex-col gap-1 w-full">
        {items.map((item, i) => (
          <button key={i} className={cn(
            "w-full flex items-center text-left rounded-md transition-colors",
            collapsed ? "justify-center p-2.5" : "px-3 py-2 gap-3",
            item.active 
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
          )}>
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-[13px]">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}
