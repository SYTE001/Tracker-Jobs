import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Download,
  Archive,
  ArchiveRestore,
  Trash2,
  LayoutList,
  MoreHorizontal,
  SlidersHorizontal,
  Rows3,
  Rows2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap, useNextActionResolver } from "@/store/selectors"
import { useApplicationFilters } from "@/hooks/useApplicationFilters"
import { filterApplications, sortApplications, type SortKey } from "@/lib/search"
import {
  STATUSES,
  SOURCES,
  PRIORITIES,
  WORK_MODES,
  JOB_TYPES,
  type Application,
  type JobStatus,
} from "@/types"
import {
  STATUS_META,
  SOURCE_LABELS,
  PRIORITY_META,
  WORK_MODE_LABELS,
  JOB_TYPE_LABELS,
} from "@/lib/constants"
import type { NextAction, Urgency } from "@/lib/nextAction"
import { formatDate, relativeTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown"
import {
  CompanyLogo,
  StatusBadge,
  PriorityBadge,
  EmptyState,
  ConfirmDialog,
  PageHeader,
  FilterChip,
} from "@/components/shared"
import { ApplicationDetail } from "./ApplicationDetail"
import { ApplicationFormModal } from "./ApplicationFormModal"
import { cn } from "@/lib/utils"

type Density = "comfortable" | "compact"

const URGENCY_TEXT: Record<Urgency, string> = {
  overdue: "text-destructive",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-amber-600 dark:text-amber-400",
  normal: "text-muted-foreground",
  none: "text-muted-foreground/60",
}

function NextActionCell({ action }: { action: NextAction }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px]", URGENCY_TEXT[action.urgency])}>
      {action.urgency !== "none" && action.urgency !== "normal" && (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", action.urgency === "overdue" ? "bg-destructive" : "bg-amber-500")} />
      )}
      {action.label}
    </span>
  )
}

/** Per-row overflow menu: Open / Edit / Change status / Archive / Delete. */
function RowActions({
  app,
  onOpen,
  onEdit,
  onSetStatus,
  onArchive,
  onDelete,
}: {
  app: Application
  onOpen: () => void
  onEdit: () => void
  onSetStatus: (s: JobStatus) => void
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="iconSm" aria-label={`Actions for ${app.job_title}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpen}>Open</DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Change status</DropdownMenuLabel>
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => onSetStatus(s)}
            className={cn(app.status === s && "font-medium")}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onArchive}>
          {app.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {app.archived ? "Restore" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ApplicationsPage() {
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const reminders = useJobStore((s) => s.reminders)
  const interviews = useJobStore((s) => s.interviews)
  const companyMap = useCompanyMap()
  const archiveApplication = useJobStore((s) => s.archiveApplication)
  const deleteApplication = useJobStore((s) => s.deleteApplication)
  const setStatus = useJobStore((s) => s.setStatus)
  const resolveNextAction = useNextActionResolver()

  const { filters, sort, set, clearAll, removeChip, chips, hasActiveFilters } = useApplicationFilters()

  const [density, setDensity] = useState<Density>("comfortable")
  const [showMore, setShowMore] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [bulkDelete, setBulkDelete] = useState(false)
  const [rowDelete, setRowDelete] = useState<Application | null>(null)

  const rows = useMemo(() => {
    const filtered = filterApplications(applications, companies, filters, { reminders, interviews })
    return sortApplications(filtered, companies, sort.key, sort.dir)
  }, [applications, companies, filters, reminders, interviews, sort])

  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null

  const toggleSort = (key: SortKey) => {
    if (sort.key === key) set({ sort: key, dir: sort.dir === "asc" ? "desc" : "asc" })
    else set({ sort: key, dir: key === "title" || key === "company" ? "asc" : "desc" })
  }

  const clearSelection = () => setSelected(new Set())

  const toggleAll = () => {
    if (selected.size === rows.length) clearSelection()
    else setSelected(new Set(rows.map((r) => r.id)))
  }

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const archiveWithUndo = (ids: string[]) => {
    if (ids.length === 0) return
    ids.forEach((id) => archiveApplication(id, true))
    clearSelection()
    toast.success(ids.length === 1 ? "Application archived" : `${ids.length} applications archived`, {
      action: { label: "Undo", onClick: () => ids.forEach((id) => archiveApplication(id, false)) },
    })
  }

  const bulkStatus = (s: JobStatus) => {
    selected.forEach((id) => setStatus(id, s))
    clearSelection()
  }

  const exportSelected = () => {
    const apps = rows.filter((r) => selected.has(r.id))
    const header = ["Job title", "Company", "Status", "Applied", "Source", "Location", "Work mode", "Priority", "Next action", "URL"]
    const lines = [
      header,
      ...apps.map((a) => [
        a.job_title,
        companyMap.get(a.company_id)?.name ?? "",
        STATUS_META[a.status].label,
        a.applied_date ?? "",
        a.source ? SOURCE_LABELS[a.source] : "",
        a.location ?? "",
        a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "",
        PRIORITY_META[a.priority].label,
        resolveNextAction(a).label,
        a.job_url ?? "",
      ]),
    ]
    const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "jobtrack-selected.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Applications" description="Every job you're tracking." />
        <EmptyState
          icon={<LayoutList className="h-5 w-5" />}
          title="Start tracking your job search"
          description="Add your first application to see it here, on the board, and on your overview."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first job
            </Button>
          }
        />
        <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
      </div>
    )
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5"

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applications"
        description={`${rows.length} of ${applications.length} applications`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add job
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query ?? ""}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search jobs, companies, notes…"
              className="pl-8"
              aria-label="Search applications"
            />
          </div>
          <Select value={filters.status ?? ""} onChange={(e) => set({ status: e.target.value })} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
          <Select value={filters.source ?? ""} onChange={(e) => set({ source: e.target.value })} aria-label="Filter by source">
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </Select>
          <Select value={filters.priority ?? ""} onChange={(e) => set({ priority: e.target.value })} aria-label="Filter by priority">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
          </Select>
          <Select value={filters.work_mode ?? ""} onChange={(e) => set({ mode: e.target.value })} aria-label="Filter by work mode">
            <option value="">All modes</option>
            {WORK_MODES.map((m) => <option key={m} value={m}>{WORK_MODE_LABELS[m]}</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> More filters
          </Button>
          <div className="ml-auto inline-flex items-center rounded-md border border-border p-0.5" role="group" aria-label="Row density">
            <Button
              variant={density === "comfortable" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => setDensity("comfortable")}
              aria-label="Comfortable density"
              aria-pressed={density === "comfortable"}
            >
              <Rows3 className="h-4 w-4" />
            </Button>
            <Button
              variant={density === "compact" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => setDensity("compact")}
              aria-label="Compact density"
              aria-pressed={density === "compact"}
            >
              <Rows2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* More filters panel */}
        {showMore && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
            <Select value={filters.job_type ?? ""} onChange={(e) => set({ type: e.target.value })} className="h-8 w-auto text-xs" aria-label="Filter by job type">
              <option value="">All job types</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
            </Select>
            <Button variant={filters.followup_due ? "secondary" : "outline"} size="sm" onClick={() => set({ due: !filters.followup_due })} aria-pressed={Boolean(filters.followup_due)}>
              Follow-up due
            </Button>
            <Button variant={filters.interview_upcoming ? "secondary" : "outline"} size="sm" onClick={() => set({ interview: !filters.interview_upcoming })} aria-pressed={Boolean(filters.interview_upcoming)}>
              Upcoming interview
            </Button>
            <Button variant={filters.archived === "all" ? "secondary" : "outline"} size="sm" onClick={() => set({ archived: filters.archived === "all" ? undefined : true })} aria-pressed={filters.archived === "all"}>
              {filters.archived === "all" ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              Show archived
            </Button>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} value={chip.value} onRemove={() => removeChip(chip.key)} />
            ))}
            <Button variant="ghost" size="xs" onClick={clearAll}>
              <X className="h-3 w-3" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Bulk bar — only when rows are selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-accent/50 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select defaultValue="" onChange={(e) => { if (e.target.value) bulkStatus(e.target.value as JobStatus) }} className="h-8 w-40 text-xs" aria-label="Change status of selected">
              <option value="">Change status…</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </Select>
            <Button variant="outline" size="sm" onClick={exportSelected}><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button variant="outline" size="sm" onClick={() => archiveWithUndo([...selected])}><Archive className="h-3.5 w-3.5" /> Archive</Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDelete(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
          </div>
        </div>
      )}

      {/* Table (desktop ≥ md) */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} aria-label="Select all" />
                </th>
                <SortHeader label="Job" k="title" active={sort} onClick={toggleSort} />
                <SortHeader label="Company" k="company" active={sort} onClick={toggleSort} />
                <Th>Status</Th>
                <SortHeader label="Applied" k="applied" active={sort} onClick={toggleSort} />
                <Th>Source</Th>
                <Th>Location</Th>
                <Th>Work mode</Th>
                <SortHeader label="Priority" k="priority" active={sort} onClick={toggleSort} />
                <Th>Next action</Th>
                <SortHeader label="Updated" k="updated" active={sort} onClick={toggleSort} />
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((app) => {
                const company = companyMap.get(app.company_id)
                const isSel = selected.has(app.id)
                return (
                  <tr
                    key={app.id}
                    className={cn("cursor-pointer transition-colors hover:bg-accent/40", isSel && "bg-accent/30", app.archived && "opacity-60")}
                    onClick={() => setDetailId(app.id)}
                  >
                    <td className={cn("px-3", rowPad)} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleOne(app.id)} aria-label={`Select ${app.job_title}`} />
                    </td>
                    <td className={cn("px-3", rowPad)}>
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo company={company} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{app.job_title}</p>
                          {app.tags?.length ? <p className="truncate text-xs text-muted-foreground">{app.tags.join(", ")}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className={cn("px-3 text-muted-foreground", rowPad)}>{company?.name ?? "—"}</td>
                    <td className={cn("px-3", rowPad)}><StatusBadge status={app.status} /></td>
                    <td className={cn("tnum px-3 text-muted-foreground", rowPad)}>{app.applied_date ? formatDate(app.applied_date, "MMM d") : "—"}</td>
                    <td className={cn("px-3 text-muted-foreground", rowPad)}>{app.source ? SOURCE_LABELS[app.source] : "—"}</td>
                    <td className={cn("px-3 text-muted-foreground", rowPad)}>{app.location || "—"}</td>
                    <td className={cn("px-3 text-muted-foreground", rowPad)}>{app.work_mode ? WORK_MODE_LABELS[app.work_mode] : "—"}</td>
                    <td className={cn("px-3", rowPad)}><PriorityBadge priority={app.priority} /></td>
                    <td className={cn("px-3", rowPad)}><NextActionCell action={resolveNextAction(app)} /></td>
                    <td className={cn("tnum px-3 text-muted-foreground", rowPad)}>{relativeTime(app.updated_at)}</td>
                    <td className={cn("px-3", rowPad)} onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        app={app}
                        onOpen={() => setDetailId(app.id)}
                        onEdit={() => setEditApp(app)}
                        onSetStatus={(s) => setStatus(app.id, s)}
                        onArchive={() => archiveWithUndo([app.id])}
                        onDelete={() => setRowDelete(app)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards (< md) */}
      <ul className="space-y-2 md:hidden">
        {rows.map((app) => {
          const company = companyMap.get(app.company_id)
          return (
            <li key={app.id} className={cn("rounded-lg border border-border", app.archived && "opacity-60")}>
              <div className="flex items-start gap-3 p-3">
                <button className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => setDetailId(app.id)}>
                  <CompanyLogo company={company} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.job_title}</p>
                    <p className="truncate text-xs text-muted-foreground">{company?.name ?? "—"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={app.status} />
                      <NextActionCell action={resolveNextAction(app)} />
                    </div>
                    <p className="tnum mt-1 text-xs text-muted-foreground">Updated {relativeTime(app.updated_at)}</p>
                  </div>
                </button>
                <RowActions
                  app={app}
                  onOpen={() => setDetailId(app.id)}
                  onEdit={() => setEditApp(app)}
                  onSetStatus={(s) => setStatus(app.id, s)}
                  onArchive={() => archiveWithUndo([app.id])}
                  onDelete={() => setRowDelete(app)}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {rows.length === 0 && (
        <EmptyState
          compact
          title="No applications match your filters"
          description="Try adjusting your search or clearing the active filters."
          action={hasActiveFilters ? <Button variant="outline" size="sm" onClick={clearAll}><X className="h-3.5 w-3.5" /> Clear all</Button> : undefined}
        />
      )}

      <ApplicationDetail application={detailApp} open={Boolean(detailApp)} onOpenChange={(o) => !o && setDetailId(null)} />
      <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
      <ApplicationFormModal open={Boolean(editApp)} onOpenChange={(o) => !o && setEditApp(null)} application={editApp ?? undefined} />
      <ConfirmDialog
        open={bulkDelete}
        onOpenChange={setBulkDelete}
        title={`Delete ${selected.size} applications?`}
        description="This permanently removes the selected applications and their history. This can’t be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { selected.forEach((id) => deleteApplication(id)); clearSelection() }}
      />
      <ConfirmDialog
        open={Boolean(rowDelete)}
        onOpenChange={(o) => !o && setRowDelete(null)}
        title={`Delete "${rowDelete?.job_title ?? ""}"?`}
        description="This permanently removes the application and its history. This can’t be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (rowDelete) deleteApplication(rowDelete.id); setRowDelete(null) }}
      />
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</th>
}

function SortHeader({
  label,
  k,
  active,
  onClick,
}: {
  label: string
  k: SortKey
  active: { key: SortKey; dir: "asc" | "desc" }
  onClick: (k: SortKey) => void
}) {
  return (
    <th className="px-3 py-2 text-left">
      <button
        onClick={() => onClick(k)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {active.key === k && (active.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  )
}



