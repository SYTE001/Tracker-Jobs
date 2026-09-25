import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { Toaster } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { useTheme } from "@/hooks/useTheme"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { MobileNav, MORE_ITEMS } from "./MobileNav"
import { CommandPalette } from "@/components/CommandPalette"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { cn } from "@/lib/utils"

export function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const ghostSweep = useJobStore((s) => s.ghostSweep)
  useTheme()

  useEffect(() => {
    ghostSweep()
  }, [ghostSweep])

  // "n" = new application, "/" focus handled by pages; ignore when typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      if (typing) return
      const k = e.key.toLowerCase()
      if (k === "n") {
        e.preventDefault()
        setAddOpen(true)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-all duration-200 md:pl-0",
          collapsed ? "md:ml-16" : "md:ml-58",
        )}
      >
        <Topbar
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenAdd={() => setAddOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main className="flex-1 pb-16 md:pb-8">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>

      <MobileNav onOpenMore={() => setMobileOpen(true)} />

      {/* Mobile "More" menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="relative w-52 rounded-lg border border-border bg-card p-1.5 shadow-xl">
            {MORE_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onAdd={() => setAddOpen(true)} />
      <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
