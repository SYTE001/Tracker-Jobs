import { useMemo, useState } from "react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import type { DropResult } from "@hello-pangea/dnd"
import { Search, Plus, KanbanSquare } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap, useNextActionResolver } from "@/store/selectors"
import { filterApplications, sortApplications } from "@/lib/search"
import type { SortKey } from "@/lib/search"
import { useApplicationFilters } from "@/hooks/useApplicationFilters"
import { STATUS_ORDER, STATUS_META, SOURCE_LABELS, PRIORITY_META, WORK_MODE_LABELS, JOB_TYPE_LABELS } from "@/lib/constants"
import { SOURCES, PRIORITIES, WORK_MODES, JOB_TYPES, type Application, type JobStatus } from "@/types"
import { daysSince } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PageHeader, EmptyState, FilterChip } from "@/components/shared"
import { KanbanCard } from "./KanbanCard"
import { ApplicationDetail } from "@/features/applications/ApplicationDetail"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { ScheduleFollowupModal } from "@/features/followups/ScheduleFollowupModal"

type Density = "comfortable" | "compact"

/** Sort options exposed by the board toolbar. "nextaction" is board-local. */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "applied", label: "Applied date" },
  { value: "priority", label: "Priority" },
  { value: "company", label: "Company" },
  { value: "title", label: "Title" },
  { value: "nextaction", label: "Next action" },
]

/** Default sort direction so string sorts read A→Z and recency reads newest first. */
const SORT_DIR: Record<string, "asc" | "desc"> = {
  updated: "desc",
  applied: "desc",
  priority: "desc",
  company: "asc",
  title: "asc",
  nextaction: "asc",
}

const URGENCY_RANK: Record<string, number> = { overdue: 0, today: 1, soon: 2, normal: 3, none: 4 }

const DATE_WINDOWS: { value: string; label: string; days: number }[] = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
]

export function BoardPage() {
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const companyMap = useCompanyMap()
  const setStatus = useJobStore((s) => s.setStatus)
  const archiveApplication = useJobStore((s) => s.archiveApplication)
  const resolveNext = useNextActionResolver()

  const reminderRows = useJobStore((s) => s.reminders)
  const interviewRows = useJobStore((s) => s.interviews)

  const { filters, sort, set, clearAll, removeChip, chips, hasActiveFilters } = useApplicationFilters()

  // View-only preferences (not shared/bookmarked).
  const [density, setDensity] = useState<Density>("comfortable")
  const [appliedWithin, setAppliedWithin] = useState("")

  // Overlays.
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [addStatus, setAddStatus] = useState<JobStatus | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [followupFor, setFollowupFor] = useState<string | null>(null)

  // Per-application card signals (reminders/interviews), computed once.
  const metaMap = useMemo(() => {
    const map = new Map<string, { nextFollowup: string | null; hasInterview: boolean }>()
    for (const app of applications) {
      const open = reminderRows
        .filter((r) => r.application_id === app.id && !r.completed)
        .sort((a, b) => a.reminder_date.localeCompare(b.reminder_date))
      map.set(app.id, {
        nextFollowup: open[0]?.reminder_date ?? null,
        hasInterview: interviewRows.some((iv) => iv.application_id === app.id),
      })
    }
    return map
  }, [applications, reminderRows, interviewRows])

  const filtered = useMemo(() => {
    const base = filterApplications(applications, companies, filters, {
      reminders: reminderRows,
      interviews: interviewRows,
    })
    if (!appliedWithin) return base
    const win = DATE_WINDOWS.find((w) => w.value === appliedWithin)
    if (!win) return base
    return base.filter((a) => {
      const d = daysSince(a.applied_date)
      return d !== null && d <= win.days
    })
  }, [applications, companies, filters, reminderRows, interviewRows, appliedWithin])

  const sorted = useMemo(() => {
    if ((sort.key as string) === "nextaction") {
      return [...filtered].sort((a, b) => {
        const na = resolveNext(a)
        const nb = resolveNext(b)
        const r = (URGENCY_RANK[na.urgency] ?? 9) - (URGENCY_RANK[nb.urgency] ?? 9)
        if (r !== 0) return r
        if (na.date && nb.date) return na.date < nb.date ? -1 : 1
        if (na.date) return -1
        if (nb.date) return 1
        return 0
      })
    }
    return sortApplications(filtered, companies, sort.key as SortKey, sort.dir)
  }, [filtered, companies, sort.key, sort.dir, resolveNext])

  const columns = useMemo(
    () => STATUS_ORDER.map((status) => ({ status, apps: sorted.filter((a) => a.status === status) })),
    [sorted],
  )

  const onDragEnd = (result: DropResult) => {
    const { destination, source: src, draggableId } = result
    if (!destination) return
    if (destination.droppableId === src.droppableId && destination.index === src.index) return
    setStatus(draggableId, destination.droppableId as JobStatus)
  }

  const openAdd = (status?: JobStatus) => {
    setAddStatus(status ?? null)
    setAddOpen(true)
  }

  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null
  const showChips = hasActiveFilters || Boolean(appliedWithin)

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Board" description="Track where every application sits in your pipeline." />
        <EmptyState
          icon={<KanbanSquare className="h-5 w-5" />}
          title="Your pipeline is empty."
          description="Add your first application to start moving it through the stages."
          action={<Button onClick={() => openAdd()}><Plus className="h-4 w-4" />Add your first job</Button>}
        />
        <ApplicationFormModal open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); setAddStatus(null) } }} defaultStatus={addStatus ?? undefined} />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader
        title="Board"
        description="Drag cards to update status, or use the menu / status selector."
        action={<Button onClick={() => openAdd()}><Plus className="h-4 w-4" />Add job</Button>}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query ?? ""}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search board…"
            className="pl-8"
            aria-label="Search applications"
          />
        </div>
        <Select value={filters.source ?? ""} onChange={(e) => set({ source: e.target.value })} className="hidden w-36 sm:block" aria-label="Source">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </Select>
        <Select value={filters.priority ?? ""} onChange={(e) => set({ priority: e.target.value })} className="hidden w-36 sm:block" aria-label="Priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
        </Select>
        <Select value={filters.work_mode ?? ""} onChange={(e) => set({ mode: e.target.value })} className="hidden w-32 sm:block" aria-label="Work mode">
          <option value="">All modes</option>
          {WORK_MODES.map((m) => <option key={m} value={m}>{WORK_MODE_LABELS[m]}</option>)}
        </Select>
        <Select value={filters.job_type ?? ""} onChange={(e) => set({ type: e.target.value })} className="hidden w-36 sm:block" aria-label="Job type">
          <option value="">All types</option>
          {JOB_TYPES.map((t) => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
        </Select>
        <Select value={appliedWithin} onChange={(e) => setAppliedWithin(e.target.value)} className="hidden w-36 md:block" aria-label="Applied date">
          <option value="">Any date</option>
          {DATE_WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
        </Select>
        <Select
          value={sort.key as string}
          onChange={(e) => set({ sort: e.target.value, dir: SORT_DIR[e.target.value] ?? "desc" })}
          className="w-44"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
        </Select>
        <Select value={density} onChange={(e) => setDensity(e.target.value as Density)} className="w-36" aria-label="Density">
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </Select>
      </div>

      {/* Active filter chips */}
      {showChips && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <FilterChip key={c.key} label={c.label} value={c.value} onRemove={() => removeChip(c.key)} />
          ))}
          {appliedWithin && (
            <FilterChip
              label="Applied"
              value={DATE_WINDOWS.find((w) => w.value === appliedWithin)?.label ?? appliedWithin}
              onRemove={() => setAppliedWithin("")}
            />
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => { clearAll(); setAppliedWithin("") }}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex h-full min-w-max items-stretch gap-4">
            {columns.map(({ status, apps }) => (
              <section
                key={status}
                className="flex h-full w-[300px] shrink-0 flex-col rounded-lg border border-border bg-muted/20"
                aria-label={`${STATUS_META[status].label} column`}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-lg border-b border-border bg-muted/40 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_META[status].dot)} aria-hidden="true" />
                    <h3 className="truncate text-[13px] font-semibold tracking-tight">{STATUS_META[status].label}</h3>
                    <span className="tnum rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{apps.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAdd(status)}
                    aria-label={`Add job to ${STATUS_META[status].label}`}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2 overflow-y-auto p-2.5 transition-colors",
                        snapshot.isDraggingOver && "bg-accent/40",
                      )}
                    >
                      {apps.map((app, i) => (
                        <KanbanCard
                          key={app.id}
                          application={app}
                          company={companyMap.get(app.company_id)}
                          meta={metaMap.get(app.id)}
                          nextAction={resolveNext(app)}
                          index={i}
                          compact={density === "compact"}
                          onOpen={() => setDetailId(app.id)}
                          onEdit={() => setEditApp(app)}
                          onFollowup={() => setFollowupFor(app.id)}
                          onArchive={() => archiveApplication(app.id, !app.archived)}
                          onSetStatus={(s) => setStatus(app.id, s)}
                        />
                      ))}
                      {apps.length === 0 && (
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-md border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground transition-colors",
                            snapshot.isDraggingOver ? "border-primary/50 text-foreground" : "",
                          )}
                        >
                          {snapshot.isDraggingOver ? "Drop to move here" : "No applications"}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>
            ))}
          </div>
        </div>
      </DragDropContext>

      <ApplicationDetail application={detailApp} open={Boolean(detailApp)} onOpenChange={(o) => !o && setDetailId(null)} />
      <ApplicationFormModal
        open={addOpen}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setAddStatus(null) } }}
        defaultStatus={addStatus ?? undefined}
      />
      <ApplicationFormModal
        open={Boolean(editApp)}
        onOpenChange={(o) => !o && setEditApp(null)}
        application={editApp ?? undefined}
      />
      <ScheduleFollowupModal open={Boolean(followupFor)} onOpenChange={(o) => !o && setFollowupFor(null)} applicationId={followupFor ?? ""} />
    </div>
  )
}
