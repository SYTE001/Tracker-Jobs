import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Command } from "cmdk"
import { Plus, Search, CornerDownLeft } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { PRIMARY, SECONDARY } from "@/lib/nav"
import { STATUS_META } from "@/lib/constants"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CompanyLogo } from "@/components/shared"

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
  const companyMap = useCompanyMap()

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

  const recent = [...applications]
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 6)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[12%] max-w-xl -translate-y-0 p-0 sm:top-[10%]">
        <Command
          loop
          className="overflow-hidden"
          filter={(value, search) => {
            const q = search.trim().toLowerCase()
            return q.length === 0 || value.toLowerCase().includes(q) ? 1 : 0
          }}
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              placeholder="Search jobs, companies, or jump to…"
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
          <Command.List className="max-h-[50vh] overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Quick actions" className="text-xs font-medium text-muted-foreground">
              <Command.Item
                onSelect={() => {
                  onOpenChange(false)
                  onAdd()
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm data-[selected=true]:bg-accent"
              >
                <Plus className="h-4 w-4" /> Add application
              </Command.Item>
              {[...PRIMARY, ...SECONDARY].map((n) => (
                <Command.Item
                  key={n.to}
                  value={`go ${n.label}`}
                  onSelect={() => {
                    onOpenChange(false)
                    navigate(n.to)
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm data-[selected=true]:bg-accent"
                >
                  <n.icon className="h-4 w-4" /> Go to {n.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Recent applications" className="text-xs font-medium text-muted-foreground">
              {recent.map((app) => (
                <Command.Item
                  key={app.id}
                  value={`${app.job_title} ${companyMap.get(app.company_id)?.name ?? ""}`}
                  onSelect={() => {
                    onOpenChange(false)
                    navigate(`/applications/${app.id}`)
                  }}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm data-[selected=true]:bg-accent"
                >
                  <CompanyLogo company={companies.find((c) => c.id === app.company_id)} size="sm" />
                  <span className="flex-1 truncate">{app.job_title}</span>
                  <span className="text-xs text-muted-foreground">{STATUS_META[app.status].label}</span>
                </Command.Item>
              ))}
              {recent.length === 0 && (
                <div className="px-3 py-3 text-sm text-muted-foreground">No applications yet.</div>
              )}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
