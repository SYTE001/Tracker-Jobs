import {
  LayoutGrid,
  LayoutList,
  KanbanSquare,
  Bookmark,
  CalendarDays,
  BellRing,
  Building2,
  BarChart3,
  Settings,
  Database,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  section: "primary" | "secondary"
  match?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", to: "/overview", icon: LayoutGrid, section: "primary" },
  { label: "Applications", to: "/applications", icon: LayoutList, section: "primary" },
  { label: "Board", to: "/board", icon: KanbanSquare, section: "primary" },
  { label: "Saved Jobs", to: "/saved", icon: Bookmark, section: "primary" },
  { label: "Interviews", to: "/interviews", icon: CalendarDays, section: "primary" },
  { label: "Follow-ups", to: "/followups", icon: BellRing, section: "primary" },
  { label: "Companies", to: "/companies", icon: Building2, section: "primary" },
  { label: "Metrics", to: "/metrics", icon: BarChart3, section: "primary" },
  { label: "Settings", to: "/settings", icon: Settings, section: "secondary" },
  { label: "Data & Backup", to: "/settings/data", icon: Database, section: "secondary" },
]

export const PRIMARY = NAV_ITEMS.filter((i) => i.section === "primary")
export const SECONDARY = NAV_ITEMS.filter((i) => i.section === "secondary")

/** Titles for each route, used by the topbar. */
export const ROUTE_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/applications": "Applications",
  "/board": "Board",
  "/saved": "Saved Jobs",
  "/interviews": "Interviews",
  "/followups": "Follow-ups",
  "/companies": "Companies",
  "/metrics": "Metrics",
  "/settings": "Settings",
  "/settings/appearance": "Appearance",
  "/settings/data": "Data & Backup",
}
