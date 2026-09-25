import { NavLink } from "react-router-dom"
import { LayoutGrid, LayoutList, KanbanSquare, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { to: "/overview", icon: LayoutGrid, label: "Overview" },
  { to: "/applications", icon: LayoutList, label: "Apps" },
  { to: "/board", icon: KanbanSquare, label: "Board" },
]

export function MobileNav({ onOpenMore }: { onOpenMore: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-border bg-card/95 backdrop-blur md:hidden">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/applications"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
      <button
        onClick={onOpenMore}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
      >
        <MoreHorizontal className="h-5 w-5" />
        More
      </button>
    </nav>
  )
}

export const MORE_ITEMS = [
  { to: "/saved", label: "Saved Jobs" },
  { to: "/interviews", label: "Interviews" },
  { to: "/followups", label: "Follow-ups" },
  { to: "/companies", label: "Companies" },
  { to: "/metrics", label: "Metrics" },
  { to: "/settings", label: "Settings" },
]
