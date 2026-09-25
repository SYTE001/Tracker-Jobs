import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Briefcase, AlertTriangle, CalendarClock, Clock, CircleDashed, ChevronRight } from "lucide-react"
import { useJobStore } from "@/store/useJobStore"
import { useCompanyMap, useAttentionQueue } from "@/store/selectors"
import { STATUS_ORDER, STATUS_META } from "@/lib/constants"
import { formatDate, relativeTime } from "@/lib/dates"
import { useJobCounts } from "@/features/metrics/metrics"
import type { AttentionItem, AttentionKind, Urgency } from "@/lib/nextAction"
import { Button } from "@/components/ui/button"
import { CompanyLogo, EmptyState, PageHeader, Section, MetricSummary } from "@/components/shared"
import { ApplicationFormModal } from "@/features/applications/ApplicationFormModal"
import { cn } from "@/lib/utils"

/* Ordered attention groups. Covers every AttentionKind classifyAttention can emit. */
const ATTENTION_GROUPS: { kind: AttentionKind; label: string; icon: React.ReactNode }[] = [
  { kind: "overdue_followup", label: "Overdue follow-ups", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { kind: "interview_soon", label: "Interviews in next 7 days", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  { kind: "deadline_soon", label: "Deadlines soon", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  { kind: "followup_today", label: "Follow-ups due today", icon: <Clock className="h-3.5 w-3.5" /> },
  { kind: "needs_action", label: "Needs next action", icon: <CircleDashed className="h-3.5 w-3.5" /> },
  { kind: "recently_changed", label: "Recently changed", icon: <Clock className="h-3.5 w-3.5" /> },
]

const URGENCY_TEXT: Record<Urgency, string> = {
  overdue: "text-destructive",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-amber-600 dark:text-amber-400",
  normal: "text-muted-foreground",
  none: "text-muted-foreground",
}

function urgencyLabel(item: AttentionItem): string {
  const { next, date } = item
  if (next.urgency === "overdue") return date ? `Overdue since ${formatDate(date, "MMM d")}` : "Overdue"
  if (next.urgency === "today") return "Due today"
  if (next.urgency === "soon" && date) return formatDate(date, "MMM d")
  if (date) return formatDate(date, "MMM d")
  return "No action scheduled"
}

export function OverviewPage() {
  const navigate = useNavigate()
  const applications = useJobStore((s) => s.applications)
  const application_events = useJobStore((s) => s.application_events)
  const companyMap = useCompanyMap()
  const counts = useJobCounts()
  const attention = useAttentionQueue()

  const [addOpen, setAddOpen] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<AttentionKind, AttentionItem[]>()
    for (const item of attention) {
      const list = map.get(item.kind)
      if (list) list.push(item)
      else map.set(item.kind, [item])
    }
    return ATTENTION_GROUPS.map((g) => ({ ...g, items: map.get(g.kind) ?? [] })).filter((g) => g.items.length > 0)
  }, [attention])

  const pipeline = useMemo(() => {
    const live = applications.filter((a) => !a.archived)
    const max = Math.max(1, ...STATUS_ORDER.map((s) => live.filter((a) => a.status === s).length))
    return STATUS_ORDER.map((status) => ({
      status,
      count: live.filter((a) => a.status === status).length,
      max,
    }))
  }, [applications])

  const recentActivity = useMemo(
    () =>
      [...application_events]
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, 8),
    [application_events],
  )

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${today} — what needs your attention today.`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add job
          </Button>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="You have no applications yet."
          description="Add your first application and track it through every stage of your search."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first job
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Hero summary */}
          <MetricSummary
            items={[
              { value: counts.total, label: "applications", onClick: () => navigate("/applications") },
              { value: counts.active, label: "active", onClick: () => navigate("/applications?status=applied") },
              { value: counts.interviews, label: "interviews", onClick: () => navigate("/interviews") },
              { value: counts.offers, label: "offers", onClick: () => navigate("/applications?status=offer") },
            ]}
          />

          {/* Attention queue — dominant module */}
          <Section
            title="Needs your attention"
            description={attention.length > 0 ? `${attention.length} ${attention.length === 1 ? "item" : "items"} to act on` : undefined}
          >
            {grouped.length === 0 ? (
              <div className="rounded-md border border-border bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
                You're all caught up. Nothing needs attention right now.
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((group) => (
                  <div key={group.kind}>
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.icon}
                      {group.label}
                      <span className="tnum font-normal normal-case text-muted-foreground/70">({group.items.length})</span>
                    </h3>
                    <ul className="divide-y divide-border">
                      {group.items.map((item) => {
                        const company = companyMap.get(item.application.company_id)
                        return (
                          <li key={item.application.id}>
                            <Link
                              to={`/applications/${item.application.id}`}
                              className="flex min-h-[44px] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <CompanyLogo company={company} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{item.application.job_title}</p>
                                <p className="truncate text-xs text-muted-foreground">{company?.name ?? "—"}</p>
                              </div>
                              <div className="hidden shrink-0 text-right sm:block">
                                <p className="text-[13px] font-medium">{item.next.label}</p>
                                <p className={cn("text-xs", URGENCY_TEXT[item.next.urgency])}>{urgencyLabel(item)}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Pipeline strip */}
          <Section title="Pipeline" description="Applications by stage">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {pipeline.map(({ status, count, max }) => (
                <Link
                  key={status}
                  to={`/applications?status=${status}`}
                  className="group flex min-h-[44px] flex-col gap-1.5 rounded-md border border-border p-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="flex items-center gap-1.5 truncate text-xs font-medium text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_META[status].dot)} />
                      <span className="truncate">{STATUS_META[status].label}</span>
                    </span>
                  </div>
                  <span className="tnum text-xl font-semibold tracking-tight">{count}</span>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", STATUS_META[status].dot)} style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </Section>

          {/* Recent activity */}
          <Section title="Recent activity" action={<Link to="/applications" className="text-xs text-muted-foreground hover:text-foreground">All applications</Link>}>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentActivity.map((event) => {
                  const app = applications.find((a) => a.id === event.application_id)
                  const company = app ? companyMap.get(app.company_id) : undefined
                  return (
                    <li key={event.id}>
                      <Link
                        to={`/applications/${event.application_id}`}
                        className="flex min-h-[44px] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{event.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {app ? `${app.job_title}${company ? ` · ${company.name}` : ""}` : "Application"}
                          </p>
                        </div>
                        <span className="tnum shrink-0 text-xs text-muted-foreground">{relativeTime(event.created_at)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>
      )}

      <ApplicationFormModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
