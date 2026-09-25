import { useLocation } from "react-router-dom"
import { Menu, Search, Plus } from "lucide-react"
import { ROUTE_TITLES } from "@/lib/nav"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/primitives"

export function Topbar({
  onToggleSidebar,
  onOpenAdd,
  onOpenCommand,
}: {
  onToggleSidebar: () => void
  onOpenAdd: () => void
  onOpenCommand: () => void
}) {
  const { pathname } = useLocation()
  const title = ROUTE_TITLES[pathname] ?? "JobTrack"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:flex"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="hidden h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground sm:flex md:hidden lg:hidden">
        <Plus className="h-4 w-4" />
      </div>
      <h1 className="text-[15px] font-semibold tracking-tight sm:text-base">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenCommand}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={onOpenCommand}
          className="hidden h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent md:flex md:w-56 lg:w-64"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <Kbd>⌘K</Kbd>
        </button>
        <Button size="sm" onClick={onOpenAdd} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          Add job
        </Button>
      </div>
    </header>
  )
}
