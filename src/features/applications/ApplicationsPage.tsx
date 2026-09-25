import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Plus, Search, Download, Archive, ArchiveRestore, Trash2, LayoutList } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { filterApplications, sortApplications, type SortKey } from "@/lib/search"
import { STATUSES, SOURCES, PRIORITIES, WORK_MODES, type Application, type JobStatus } from "@/types"
import { STATUS_META, SOURCE_LABELS, PRIORITY_META, WORK_MODE_LABELS } from "@/lib/constants"
import { formatDate, relativeTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { CompanyLogo, StatusBadge, PriorityBadge, EmptyState, ConfirmDialog, PageHeader } from "@/components/shared"
import { ApplicationDetail } from "./ApplicationDetail"
import { ApplicationFormModal } from "./ApplicationFormModal"
import { cn } from "@/lib/utils"

type SortState = { key: SortKey; dir: "asc" | "desc" }

export function ApplicationsPage() {
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const companyMap = useCompanyMap()
  const archiveApplication = useJobStore((s) => s.archiveApplication)
  const deleteApplication = useJobStore((s) => s.deleteApplication)
  const setStatus = useJobStore((s) => s.setStatus)

  const [query, setQuery] = useState("")
  const [status, setStatusF] = useState("")
  const [source, setSourceF] = useState("")
  const [priority, setPriorityF] = useState("")
  const [workMode, setWorkModeF] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [sort, setSort] = useState<SortState>({ key: "updated", dir: "desc" })

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [bulkDelete, setBulkDelete] = useState(false)

  const rows = useMemo(() => {
    const filtered = filterApplications(applications, companies, {
      query: query || undefined,
      status: status || undefined,
      source: source || undefined,
      priority: priority || undefined,
      work_mode: workMode || undefined,
      archived: showArchived ? "all" : false,
    })
    return sortApplications(filtered, companies, sort.key, sort.dir)
  }, [applications, companies, query, status, source, priority, workMode, showArchived, sort])

  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "title" || key === "company" ? "asc" : "desc" }))
  }

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set())
    else setSelected(new Set(rows.map((r) => r.id)))
  }

  const bulkStatus = (s: JobStatus) => {
    selected.forEach((id) => setStatus(id, s))
    setSelected(new Set())
  }

  const exportSelected = () => {
    const apps = rows.filter((r) => selected.has(r.id))
    const header = ["Job title", "Company", "Status", "Applied", "Source", "Location", "URL", "Notes"]
    const lines = [header, ...apps.map((a) => [
      a.job_title,
      companyMap.get(a.company_id)?.name ?? "",
      STATUS_META[a.status].label,
      a.applied_date ?? "",
      a.source ? SOURCE_LABELS[a.source] : "",
      a.location ?? "",
      a.job_url ?? "",
      (a.notes ?? "").replace(/\n/g, " "),
    ])]
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
          action={<Button onClick={() => setEditApp({} as Application)}><Plus className="h-4 w-4" />Add your first job</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applications"
        description={`${rows.length} of ${applications.length} applications`}
        action={
          <Button onClick={() => setEditApp({} as Application)}>
            <Plus className="h-4 w-4" /> Add job
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs, companies, notes…" className="pl-8" />
        </div>
        <Select value={status} onChange={(e) => { setStatusF(e.target.value); setSelected(new Set()) }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </Select>
        <Select value={source} onChange={(e) => { setSourceF(e.target.value); setSelected(new Set()) }}>
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </Select>
        <Select value={priority} onChange={(e) => { setPriorityF(e.target.value); setSelected(new Set()) }}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
        </Select>
        <Select value={workMode} onChange={(e) => { setWorkModeF(e.target.value); setSelected(new Set()) }}>
          <option value="">All modes</option>
          {WORK_MODES.map((m) => <option key={m} value={m}>{WORK_MODE_LABELS[m]}</option>)}
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-accent/50 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select defaultValue="" onChange={(e) => { if (e.target.value) bulkStatus(e.target.value as JobStatus) }} className="h-8 w-40 text-xs">
              <option value="">Change status…</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </Select>
            <Button variant="outline" size="sm" onClick={exportSelected}><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button variant="outline" size="sm" onClick={() => { selected.forEach((id) => archiveApplication(id, true)); setSelected(new Set()) }}>Archive</Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDelete(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>
      )}

      {/* Table (desktop) */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="w-8 px-3 py-2"><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} aria-label="Select all" /></th>
                <SortHeader label="Job" k="title" active={sort} onClick={toggleSort} />
                <SortHeader label="Company" k="company" active={sort} onClick={toggleSort} />
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <SortHeader label="Applied" k="applied" active={sort} onClick={toggleSort} />
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Priority</th>
                <SortHeader label="Updated" k="updated" active={sort} onClick={toggleSort} />
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((app) => {
                const company = companyMap.get(app.company_id)
                const isSel = selected.has(app.id)
                return (
                  <tr key={app.id} className={cn("cursor-pointer transition-colors hover:bg-accent/40", app.archived && "opacity-60")} onClick={() => setDetailId(app.id)}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSel} onChange={() => setSelected((prev) => { const next = new Set(prev); if (next.has(app.id)) next.delete(app.id); else next.add(app.id); return next })} aria-label={`Select ${app.job_title}`} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo company={company} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{app.job_title}</p>
                          {app.tags?.length ? <p className="truncate text-xs text-muted-foreground">{app.tags.join(", ")}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{company?.name ?? "—"}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={app.status} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{app.applied_date ? formatDate(app.applied_date, "MMM d") : "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{app.source ? SOURCE_LABELS[app.source] : "—"}</td>
                    <td className="px-3 py-2.5"><PriorityBadge priority={app.priority} /></td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">{relativeTime(app.updated_at)}</td>
                    <td className="px-3 py-2.5" />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <EmptyState
          compact
          title="No applications match your filters"
          description="Try adjusting your search or clearing a filter."
        />
      )}

      <ApplicationDetail application={detailApp} open={Boolean(detailApp)} onOpenChange={(o) => !o && setDetailId(null)} />
      <ApplicationFormModal open={Boolean(editApp && editApp.id)} onOpenChange={(o) => !o && setEditApp(null)} application={editApp?.id ? editApp : undefined} />
      <ConfirmDialog
        open={bulkDelete}
        onOpenChange={setBulkDelete}
        title={`Delete ${selected.size} applications?`}
        description="This permanently removes the selected applications and their history. This can’t be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { selected.forEach((id) => deleteApplication(id)); setSelected(new Set()) }}
      />
    </div>
  )
}

function SortHeader({
  label,
  k,
  active,
  onClick,
}: {
  label: string
  k: SortKey
  active: SortState | null
  onClick: (k: SortKey) => void
}) {
  return (
    <th className="px-3 py-2 text-left">
      <button
        onClick={() => onClick(k)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {label}
        {active?.key === k && (active.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  )
}
