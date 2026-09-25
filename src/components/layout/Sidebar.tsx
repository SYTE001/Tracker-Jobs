import { NavLink } from "react-router-dom"
import { Briefcase } from "lucide-react"
import { PRIMARY, SECONDARY } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { useDueCounts } from "@/store/selectors"

export function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
}: {
  collapsed: boolean
  mobileOpen: boolean
  onClose: () => void
}) {
  const { overdue } = useDueCounts()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group flex w-full items-center gap-3 rounded-md text-[13px] font-medium transition-colors",
      collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
      isActive
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
    )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-200 md:translate-x-0",
          collapsed ? "md:w-[64px]" : "md:w-[232px]",
          mobileOpen ? "w-[232px] translate-x-0 shadow-2xl" : "w-[232px] -translate-x-full",
        )}
      >
        <div className={cn("flex items-center gap-2.5 px-4 pb-4 pt-5", collapsed && "md:justify-center md:px-0")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div>
              <p className="text-sm font-semibold leading-tight tracking-tight">JobTrack</p>
              <p className="text-[10px] leading-tight text-muted-foreground">Job application tracker</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
          <p className={cn("px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "md:hidden")}>
            Workspace
          </p>
          {PRIMARY.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/applications"} className={linkClass} onClick={onClose}>
              <item.icon className="h-4 w-4 shrink-0" />
              {(!collapsed || mobileOpen) && <span className="flex-1 text-left">{item.label}</span>}
              {(!collapsed || mobileOpen) && item.label === "Follow-ups" && overdue > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                  {overdue}
                </span>
              )}
            </NavLink>
          ))}

          <p className={cn("px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "md:hidden")}>
            System
          </p>
          {SECONDARY.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              <item.icon className="h-4 w-4 shrink-0" />
              {(!collapsed || mobileOpen) && <span className="flex-1 text-left">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={cn("border-t border-border px-4 py-3 text-[11px] text-muted-foreground", collapsed && "md:hidden")}>
          <p className="font-medium">Local-first</p>
          <p>Your data stays in this browser.</p>
        </div>
      </aside>
    </>
  )
}
