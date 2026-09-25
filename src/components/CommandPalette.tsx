import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Command } from "cmdk"
import { Plus, Search, CornerDownLeft, Building2, Bookmark, CalendarDays, BellRing, Briefcase } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { PRIMARY, SECONDARY } from "@/lib/nav"
import { globalSearch, ENTITY_LABEL, type SearchEntity } from "@/lib/globalSearch"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/primitives"

const ENTITY_ICON: Record<SearchEntity, typeof Briefcase> = {
  application: Briefcase,
  company: Building2,
  saved: Bookmark,
  interview: CalendarDays,
  followup: BellRing,
}

const GROUP_ORDER: SearchEntity[] = ["application", "company", "saved", "interview", "followup"]

export function CommandPalette({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onAdd: () => void
}) {
  const navigate = useNavigate()
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const saved_jobs = useJobStore((s) => s.saved_jobs)
  const interviews = useJobStore((s) => s.interviews)
  const reminders = useJobStore((s) => s.reminders)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  // Reset the query whenever the palette closes.
  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const results = useMemo(
    () => globalSearch({ applications, companies, saved_jobs, interviews, reminders }, query),
    [applications, companies, saved_jobs, interviews, reminders, query],
  )

  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[12%] max-w-xl -translate-y-0 p-0 shadow-overlay sm:top-[10%]">
        {/* We drive matching via globalSearch, so disable cmdk's own filter. */}
        <Command loop shouldFilter={false} className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search applications, companies, interviews…"
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <span className="hidden items-center gap-1 text-muted-foreground/60 sm:flex">
              <CornerDownLeft className="h-3.5 w-3.5" />
              <Kbd>Esc</Kbd>
            </span>
          </div>
          <Command.List className="max-h-[52vh] overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches for “{query}”.
            </Command.Empty>

            {query.trim() === "" && (
              <Command.Group heading="Quick actions" className="px-1 pb-1 pt-1.5 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1">
                <Command.Item
                  value="add application"
                  onSelect={() => {
                    onOpenChange(false)
                    onAdd()
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
                >
                  <Plus className="h-4 w-4" /> Add application
                </Command.Item>
                {[...PRIMARY, ...SECONDARY].map((n) => (
                  <Command.Item
                    key={n.to}
                    value={`go ${n.label}`}
                    onSelect={() => go(n.to)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
                  >
                    <n.icon className="h-4 w-4 text-muted-foreground" /> Go to {n.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {GROUP_ORDER.map((entity) => {
              const items = results[entity]
              if (!items.length) return null
              const Icon = ENTITY_ICON[entity]
              const heading = query.trim() === "" && entity === "application" ? "Recent applications" : ENTITY_LABEL[entity]
              return (
                <Command.Group
                  key={entity}
                  heading={heading}
                  className="px-1 pb-1 pt-1.5 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1"
                >
                  {items.map((r) => (
                    <Command.Item
                      key={r.id}
                      value={`${entity}-${r.id}-${r.title}-${r.subtitle}`}
                      onSelect={() => go(r.to)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="max-w-[40%] truncate text-xs text-muted-foreground">{r.subtitle}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
