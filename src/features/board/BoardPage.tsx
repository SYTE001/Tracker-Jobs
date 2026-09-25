import { useMemo, useState } from "react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import type { DropResult } from "@hello-pangea/dnd"
import { Search, Plus, KanbanSquare } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap } from "@/store/selectors"
import { filterApplications } from "@/lib/search"
import { STATUS_ORDER, STATUS_META, SOURCE_LABELS, PRIORITY_META, WORK_MODE_LABELS } from "@/lib/constants"
import { STATUSES, SOURCES, PRIORITIES, WORK_MODES, type Application, type JobStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PageHeader, EmptyState } from "@/components/shared"
import { KanbanCard } from "./KanbanCard"
import { ApplicationDetail } from "@/features/applications/ApplicationDetail"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { ScheduleFollowupModal } from "@/features/followups/ScheduleFollowupModal"

export function BoardPage() {
  const applications = useJobStore((s) => s.applications)
  const companies = useJobStore((s) => s.companies)
  const companyMap = useCompanyMap()
  const setStatus = useJobStore((s) => s.setStatus)
  const archiveApplication = useJobStore((s) => s.archiveApplication)

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [source, setSource] = useState("")
  const [priority, setPriority] = useState("")
  const [workMode, setWorkMode] = useState("")
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable")

  const [detailId, setDetailId] = useState<string | null>(null)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [followupFor, setFollowupFor] = useState<string | null>(null)

  // Pre-compute per-application card meta (reminders/interviews) once, not per card.
  const reminderRows = useJobStore((s) => s.reminders)
  const interviewRows = useJobStore((s) => s.interviews)
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
    return filterApplications(applications, companies, {
      query: query || undefined,
      source: source || undefined,
      priority: priority || undefined,
      work_mode: workMode || undefined,
      archived: false,
    })
  }, [applications, companies, query, source, priority, workMode])

  const columns = useMemo(() => {
    const active = statusFilter
      ? STATUS_ORDER.filter((s) => s === statusFilter)
      : STATUS_ORDER
    return active
      .map((status) => ({
        status,
        apps: filtered.filter((a) => a.status === status),
      }))
      .filter((c) => statusFilter || c.apps.length > 0 || true)
  }, [filtered, statusFilter])

  const onDragEnd = (result: DropResult) => {
    const { destination, source: src, draggableId } = result
    if (!destination) return
    if (destination.droppableId === src.droppableId && destination.index === src.index) return
    setStatus(draggableId, destination.droppableId as JobStatus)
  }

  const detailApp = detailId ? applications.find((a) => a.id === detailId) ?? null : null

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Board" description="Drag applications through the pipeline." />
        <EmptyState
          icon={<KanbanSquare className="h-5 w-5" />}
          title="Your pipeline is empty"
          description="Add your first application to start moving it through the stages."
          action={<Button onClick={() => setEditApp({} as Application)}><Plus className="h-4 w-4" />Add your first job</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader
        title="Board"
        description="Drag cards to update status, or use the dropdown on mobile."
        action={<Button onClick={() => setEditApp({} as Application)}><Plus className="h-4 w-4" />Add job</Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search board…" className="pl-8" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </Select>
        <Select value={source} onChange={(e) => setSource(e.target.value)} className="hidden w-36 sm:block">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="hidden w-36 sm:block">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
        </Select>
        <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="hidden w-32 sm:block">
          <option value="">All modes</option>
          {WORK_MODES.map((m) => <option key={m} value={m}>{WORK_MODE_LABELS[m]}</option>)}
        </Select>
        <Select
          value={density}
          onChange={(e) => setDensity(e.target.value as "compact" | "comfortable")}
          className="w-32"
          aria-label="Density"
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </Select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex h-full min-w-max items-start gap-4">
            {columns.map(({ status, apps }) => (
              <div key={status} className="flex h-full w-[300px] shrink-0 flex-col rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_META[status].dot)} />
                    <h3 className="text-[13px] font-semibold tracking-tight">{STATUS_META[status].label}</h3>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{apps.length}</span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 overflow-y-auto p-2.5 ${snapshot.isDraggingOver ? "bg-muted/40" : ""}`}
                    >
                      {apps.map((app, i) => (
                        <div key={app.id}>
                          <KanbanCard
                            application={app}
                            company={companyMap.get(app.company_id)}
                            meta={metaMap.get(app.id)}
                            index={i}
                            compact={density === "compact"}
                            onOpen={() => setDetailId(app.id)}
                            onEdit={() => setEditApp(app)}
                            onFollowup={() => setFollowupFor(app.id)}
                            onArchive={() => archiveApplication(app.id, !app.archived)}
                          />
                          {/* Mobile status fallback (drag not required) */}
                          <div className="mt-1 md:hidden">
                            <Select
                              value={app.status}
                              onChange={(e) => setStatus(app.id, e.target.value as JobStatus)}
                              className="h-8 text-xs"
                              aria-label={`Status for ${app.job_title}`}
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                            </Select>
                          </div>
                        </div>
                      ))}
                      {apps.length === 0 && (
                        <p className="px-2 py-6 text-center text-xs text-muted-foreground">No cards</p>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      <ApplicationDetail application={detailApp} open={Boolean(detailApp)} onOpenChange={(o) => !o && setDetailId(null)} />
      <ApplicationFormModal open={Boolean(editApp && editApp.id)} onOpenChange={(o) => !o && setEditApp(null)} application={editApp?.id ? editApp : undefined} />
      <ScheduleFollowupModal open={Boolean(followupFor)} onOpenChange={(o) => !o && setFollowupFor(null)} applicationId={followupFor ?? ""} />
    </div>
  )
}
